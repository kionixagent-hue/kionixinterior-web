/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS CLI script,
   not part of the Next.js app bundle; runs directly via `node` on Node 20 in prod. */
const { existsSync } = require('fs')
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const postgres = require('postgres')

const API_BASE = 'https://api.snapgen.ai/uapi/v1'
const SLUG = '5-tips-memilih-warna-cat-interior-rumah-di-batam'

// One cover (16:9) + two inline body images (4:3), inserted before the given
// heading in each locale's body text.
const IMAGES = [
  {
    slot: 'cover',
    aspect_ratio: '16:9',
    prompt:
      'Warm, bright modern living room interior in a tropical Indonesian home, walls painted in warm neutral cream and ivory tones, natural daylight, minimalist furniture, photorealistic architectural photography',
  },
  {
    slot: 'body',
    aspect_ratio: '4:3',
    prompt:
      'Cozy living room with warm ivory white walls reflecting soft daylight, tropical minimalist interior, photorealistic',
    insertBefore: { id: '\n\n## 2. Batasi', en: '\n\n## 2. Keep dark' },
    alt: { id: 'Ruang tamu dengan warna netral hangat', en: 'Living room with warm neutral colors' },
  },
  {
    slot: 'body',
    aspect_ratio: '4:3',
    prompt:
      'West-facing bedroom interior with one sage green accent wall, warm afternoon sunlight coming through the window, photorealistic',
    insertBefore: { id: '\n\n## 4. Gunakan cat', en: '\n\n## 4. Use paint' },
    alt: { id: 'Kamar dengan aksen dinding hijau sage', en: 'Room with a sage green accent wall' },
  },
]

async function generateImage(apiKey, { prompt, aspect_ratio }) {
  const form = new FormData()
  form.set('prompt', prompt)
  form.set('model', 'nano-banana-pro')
  form.set('aspect_ratio', aspect_ratio)
  form.set('style', 'Photorealistic')
  form.set('resolution', '1K')

  const res = await fetch(`${API_BASE}/generate_image`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: form,
  })
  if (!res.ok) throw new Error(`generate_image failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return pollUntilDone(apiKey, data.uuid, data)
}

async function pollUntilDone(apiKey, uuid, initial) {
  let record = initial
  for (let i = 0; record.status !== 2 && i < 20; i++) {
    if (record.status === 3) throw new Error(`generation failed: ${record.error_message}`)
    await new Promise((r) => setTimeout(r, 3000))
    const res = await fetch(`${API_BASE}/history/${uuid}`, { headers: { 'x-api-key': apiKey } })
    if (!res.ok) throw new Error(`history poll failed: ${res.status} ${await res.text()}`)
    record = await res.json()
  }
  if (record.status !== 2) throw new Error(`generation timed out: ${uuid}`)
  return record.generate_result ?? record.generated_image?.[0]?.image_url
}

async function main() {
  const apiKey = process.env.SNAPGEN_API_KEY
  if (!apiKey) throw new Error('SNAPGEN_API_KEY is not set (add it to .env.local)')

  const sql = postgres(process.env.DATABASE_URL)

  const [row] = await sql`
    select article_id from article_translations where locale = 'id' and slug = ${SLUG}
  `
  if (!row) throw new Error(`article not found for slug ${SLUG}`)
  const articleId = row.article_id

  for (const img of IMAGES) {
    console.log(`Generating ${img.slot} image...`)
    const url = await generateImage(apiKey, img)
    console.log(`  -> ${url}`)

    if (img.slot === 'cover') {
      await sql`update articles set cover_image_url = ${url} where id = ${articleId}`
      continue
    }

    for (const locale of ['id', 'en']) {
      const marker = img.insertBefore[locale]
      const markdown = `\n\n![${img.alt[locale]}](${url})${marker}`
      // ponytail: Postgres replace() rewrites every occurrence of `marker`, not just one —
      // do the substitution in JS (String.replace with a string pattern hits only the
      // first match) and write the whole body back, so a repeated marker can't duplicate.
      const [current] = await sql`
        select body from article_translations where article_id = ${articleId} and locale = ${locale}
      `
      await sql`
        update article_translations
        set body = ${current.body.replace(marker, markdown)}
        where article_id = ${articleId} and locale = ${locale}
      `
    }
  }

  console.log('Done.')
  await sql.end()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
