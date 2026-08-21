/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS CLI script,
   not part of the Next.js app bundle; runs directly via `node` on Node 20 in prod (cron container). */
const { existsSync } = require('fs')
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const postgres = require('postgres')
const { writeFile, mkdir } = require('fs/promises')
const { randomUUID } = require('crypto')
const path = require('path')
const { execFileSync } = require('child_process')

const SNAPGEN_API_BASE = 'https://api.snapgen.ai/uapi/v1'
const FIRECRAWL_SEARCH_URL = 'https://api.firecrawl.dev/v1/search'
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads')
const TRENDING_QUERY = 'tren desain interior rumah Indonesia Batam 2026'

// ---- topic discovery (Firecrawl) ----

async function searchTrendingTopics(apiKey) {
  const res = await fetch(FIRECRAWL_SEARCH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: TRENDING_QUERY, limit: 10 }),
  })
  if (!res.ok) throw new Error(`firecrawl search failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const results = data.data ?? data.results ?? []
  return results.map((r) => r.title).filter((t) => typeof t === 'string' && t.trim().length > 0)
}

// duplicated from src/lib/topics/dedupe.ts (this script stays plain CJS, no ts-node
// bridge, same divergence documented for persistImageLocally below)
function filterNewKeywords(candidates, existingKeywords) {
  const existing = new Set(existingKeywords.map((k) => k.trim().toLowerCase()))
  const seen = new Set()
  return candidates.filter((c) => {
    const key = c.trim().toLowerCase()
    if (!key || existing.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---- article text generation (Claude CLI headless) ----

// duplicated from src/lib/articleGen/buildPrompt.ts
function buildArticlePrompt(topic) {
  return `Kamu adalah content writer untuk Kionix Interior, studio interior design & renovasi di Batam, Indonesia. Target pembaca: pemilik rumah/apartemen di Batam yang mempertimbangkan renovasi interior, dengan konteks iklim tropis (lembap, panas).

Tulis satu artikel blog SEO tentang topik: "${topic}".

Tulis dalam gaya artikel Kionix Interior yang sudah ada: praktis, actionable, tips bernomor dengan heading markdown "## ", tiap section 2-4 kalimat, diakhiri paragraf CTA yang mengarahkan pembaca menghubungi Kionix Interior lewat WhatsApp untuk konsultasi.

Balas HANYA dengan satu JSON object mentah (tanpa markdown code fence, tanpa teks pembungkus apa pun), persis struktur berikut:

{
  "tags": ["1-3 tag kebab-case relevan, contoh kitchen-set"],
  "id": {
    "title": "judul artikel dalam Bahasa Indonesia",
    "quickAnswer": "1-2 kalimat ringkasan jawaban cepat",
    "body": "body artikel markdown, 4-6 section '## ', tiap section >= 40 karakter, CTA WhatsApp di akhir",
    "metaDescription": "meta description <= 160 karakter",
    "faq": [{ "q": "pertanyaan", "a": "jawaban" }]
  },
  "en": {
    "title": "article title in English",
    "quickAnswer": "1-2 sentence quick answer summary",
    "body": "markdown body, 4-6 '## ' sections, each >= 40 chars, WhatsApp CTA at the end",
    "metaDescription": "meta description <= 160 chars",
    "faq": [{ "q": "question", "a": "answer" }]
  }
}

Section heading (judul '## ...') di "id" dan "en" tidak perlu sama persis kata-katanya — masing-masing ditulis natural dalam bahasanya sendiri.`
}

// duplicated from src/lib/cli/extractJson.ts
function extractJsonObject(raw) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('no JSON object found in CLI output')
  }
  return raw.slice(start, end + 1)
}

function generateArticleJson(topic) {
  const prompt = buildArticlePrompt(topic)
  // `claude -p --output-format json` returns an envelope; the actual response text is
  // in `.result` (confirmed via a live test call — do not assume a single JSON.parse).
  // Prompt goes via stdin (not argv) — avoids shell-escaping a long LLM prompt full of
  // quotes/newlines. `.cmd` needs shell:true to spawn at all on Windows (dev-only; the
  // prod cron container is Alpine Linux where a plain `claude` binary is on PATH).
  const stdout = execFileSync(process.platform === 'win32' ? 'claude.cmd' : 'claude', ['-p', '--output-format', 'json'], {
    input: prompt,
    maxBuffer: 10 * 1024 * 1024,
    env: process.env,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  })
  const envelope = JSON.parse(stdout)
  if (envelope.is_error) throw new Error(`claude CLI error: ${envelope.result}`)
  const resultText = envelope.result
  try {
    return JSON.parse(resultText)
  } catch {
    return JSON.parse(extractJsonObject(resultText))
  }
}

// ---- image generation (snapgen.ai) — duplicated from scripts/generate-article-images.js ----

async function generateImage(apiKey, { prompt, aspect_ratio }) {
  const form = new FormData()
  form.set('prompt', prompt)
  form.set('model', 'nano-banana-pro')
  form.set('aspect_ratio', aspect_ratio)
  form.set('style', 'Photorealistic')
  form.set('resolution', '1K')

  const res = await fetch(`${SNAPGEN_API_BASE}/generate_image`, {
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
    const res = await fetch(`${SNAPGEN_API_BASE}/history/${uuid}`, { headers: { 'x-api-key': apiKey } })
    if (!res.ok) throw new Error(`history poll failed: ${res.status} ${await res.text()}`)
    record = await res.json()
  }
  if (record.status !== 2) throw new Error(`generation timed out: ${uuid}`)
  const url = record.generate_result ?? record.generated_image?.[0]?.image_url
  return persistImageLocally(url)
}

async function persistImageLocally(sourceUrl) {
  const res = await fetch(sourceUrl)
  if (!res.ok) throw new Error(`failed to download image: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  const contentType = res.headers.get('content-type') ?? ''
  const ext = contentType.includes('png')
    ? '.png'
    : contentType.includes('webp')
      ? '.webp'
      : contentType.includes('jpeg') || contentType.includes('jpg')
        ? '.jpg'
        : path.extname(new URL(sourceUrl).pathname) || '.jpg'

  const filename = `${randomUUID()}${ext}`
  await mkdir(UPLOADS_DIR, { recursive: true })
  await writeFile(path.join(UPLOADS_DIR, filename), buffer)
  return `/uploads/${filename}`
}

// duplicated from src/lib/images/sections.ts
const MIN_CONTENT_LENGTH = 40
const IMAGE_MARKDOWN_RE = /!\[[^\]]*\]\([^)]*\)/
const COVER_PROMPT_MAX_LENGTH = 300

function splitSections(body) {
  const sections = []
  let offset = 0
  for (const chunk of body.split(/\n(?=## )/)) {
    if (chunk.startsWith('## ')) {
      const heading = chunk.match(/^##\s+(.+)/)?.[1].trim() ?? ''
      const content = chunk.replace(/^##.*\n?/, '').trim()
      sections.push({ heading, content, raw: chunk, start: offset, hasImage: IMAGE_MARKDOWN_RE.test(content) })
    }
    offset += chunk.length + 1
  }
  return sections
}

function qualifyingSections(sections) {
  return sections.filter((s) => !s.hasImage && s.content.length >= MIN_CONTENT_LENGTH)
}

function insertImageAfterSection(body, section, imageMarkdown) {
  const end = section.start + section.raw.length
  const updatedRaw = `${section.raw.trimEnd()}\n\n${imageMarkdown}`
  return body.slice(0, section.start) + updatedRaw + body.slice(end)
}

function buildSectionImagePrompt(heading) {
  return `${heading} — warm tropical interior, photorealistic`
}

function buildCoverPrompt(title, quickAnswer) {
  return `${title}. ${quickAnswer}`.slice(0, COVER_PROMPT_MAX_LENGTH)
}

// insert an image after every qualifying section (recomputing sections fresh after
// each insert, since start offsets shift once a section's raw text grows) — every
// subheader gets an image, not just the first couple.
async function insertBodyImages(snapgenApiKey, body) {
  let current = body
  while (true) {
    const qualifying = qualifyingSections(splitSections(current))
    if (qualifying.length === 0) break
    const section = qualifying[0]
    const url = await generateImage(snapgenApiKey, {
      prompt: buildSectionImagePrompt(section.heading),
      aspect_ratio: '4:3',
    })
    current = insertImageAfterSection(current, section, `![${section.heading}](${url})`)
  }
  return current
}

// duplicated from src/lib/blog/slug.ts
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueSlug(base, existingSlugs) {
  const taken = new Set(existingSlugs)
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

async function main() {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  const snapgenKey = process.env.SNAPGEN_API_KEY
  if (!firecrawlKey) throw new Error('FIRECRAWL_API_KEY is not set')
  if (!snapgenKey) throw new Error('SNAPGEN_API_KEY is not set')

  const sql = postgres(process.env.DATABASE_URL)

  // 1. discover + queue new topics
  const candidates = await searchTrendingTopics(firecrawlKey)
  const existingRows = await sql`select keyword from topics`
  const newKeywords = filterNewKeywords(
    candidates,
    existingRows.map((r) => r.keyword)
  )
  for (const keyword of newKeywords) {
    await sql`insert into topics (keyword, source, status) values (${keyword}, 'firecrawl', 'new')`
  }
  console.log(`Discovered ${candidates.length} candidates, queued ${newKeywords.length} new topics.`)

  // 2. pick oldest unused topic
  const [topic] = await sql`select * from topics where status = 'new' order by discovered_at asc limit 1`
  if (!topic) {
    console.log('No new topic today.')
    await sql.end()
    return
  }
  console.log(`Selected topic: ${topic.keyword}`)

  try {
    // 3. generate article text
    const article = generateArticleJson(topic.keyword)

    // 4. cover image
    const coverUrl = await generateImage(snapgenKey, {
      prompt: buildCoverPrompt(article.id.title, article.id.quickAnswer),
      aspect_ratio: '16:9',
    })
    console.log(`Cover: ${coverUrl}`)

    // 5. body images per locale (independent — each locale finds its own sections —
    // run in parallel, each locale's images/polling don't depend on the other)
    const [idBody, enBody] = await Promise.all([
      insertBodyImages(snapgenKey, article.id.body),
      insertBodyImages(snapgenKey, article.en.body),
    ])

    // 6. unique slugs
    const existingSlugs = (await sql`select slug from article_translations`).map((r) => r.slug)
    const idSlug = uniqueSlug(generateSlug(article.id.title), existingSlugs)
    const enSlug = uniqueSlug(generateSlug(article.en.title), [...existingSlugs, idSlug])

    // 7. insert article + both translations atomically — a NOT NULL violation on one
    // translation (e.g. LLM omitted a required field) must not leave an orphaned
    // articles row with zero/one translation behind.
    let insertedId
    await sql.begin(async (tx) => {
      const [inserted] = await tx`
        insert into articles (status, tags, cover_image_url)
        values ('in_review', ${article.tags}, ${coverUrl})
        returning id
      `
      insertedId = inserted.id
      await tx`
        insert into article_translations (article_id, locale, slug, title, quick_answer, body, meta_description, faq)
        values (${inserted.id}, 'id', ${idSlug}, ${article.id.title}, ${article.id.quickAnswer}, ${idBody}, ${article.id.metaDescription}, ${sql.json(article.id.faq)})
      `
      await tx`
        insert into article_translations (article_id, locale, slug, title, quick_answer, body, meta_description, faq)
        values (${inserted.id}, 'en', ${enSlug}, ${article.en.title}, ${article.en.quickAnswer}, ${enBody}, ${article.en.metaDescription}, ${sql.json(article.en.faq)})
      `
    })
    console.log(`Inserted article ${insertedId} (in_review): /${idSlug} (id), /en/blog/${enSlug} (en)`)

    // 8. mark topic used — only after the article insert succeeds
    await sql`update topics set status = 'used' where id = ${topic.id}`
  } catch (err) {
    console.error(`daily-article failed, topic "${topic.keyword}" left as 'new' for retry: ${err.message}`)
    await sql.end()
    process.exit(1)
  }

  await sql.end()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
