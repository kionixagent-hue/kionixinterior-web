/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS CLI script,
   not part of the Next.js app bundle; runs directly via `node` on Node 20 in prod (cron container). */
const { existsSync } = require('fs')
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const postgres = require('postgres')
const sharp = require('sharp')
const { writeFile, mkdir, readFile } = require('fs/promises')
const { randomUUID } = require('crypto')
const path = require('path')

const SITE_URL = 'https://kionixinterior.com'
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads')
const CTA_SLIDE_PATH = path.join(__dirname, '..', 'public', 'social', 'cta-slide.jpg')

// Verified live against the Zernio API on 2026-08-26 — see
// docs/plans/2026-08-26-instagram-tiktok-auto-posting.md's "Kontrak API Zernio".
const ZERNIO_PROFILE_ID = '6a8ee5110a22a0bf10cac5e6'
const ZERNIO_IG_ACCOUNT_ID = '6a8f0e2c77555aae01b41e37'
const ZERNIO_TIKTOK_ACCOUNT_ID = '6a8f0f6177555aae01b4ed87'
const ZERNIO_TIKTOK_PRIVACY_LEVEL = 'PUBLIC_TO_EVERYONE'
const MAX_POINT_SLIDES = 5

// ---- duplicated from src/lib/images/sections.ts (plain CJS script, no ts-node bridge) ----
const IMAGE_MARKDOWN_RE = /!\[[^\]]*\]\([^)]*\)/
const IMAGE_URL_RE = /!\[[^\]]*\]\(([^)]*)\)/

function splitSections(body) {
  const sections = []
  let offset = 0
  for (const chunk of body.split(/\n(?=## )/)) {
    if (chunk.startsWith('## ')) {
      const heading = chunk.match(/^##\s+(.+)/)?.[1].trim() ?? ''
      const content = chunk.replace(/^##.*\n?/, '').trim()
      sections.push({ heading, content, hasImage: IMAGE_MARKDOWN_RE.test(content) })
    }
    offset += chunk.length + 1
  }
  return sections
}

// ---- duplicated from src/lib/social/slidePlan.ts ----
function buildSlidePlan(article) {
  const pointSlides = splitSections(article.body)
    .filter((s) => s.hasImage)
    .slice(0, MAX_POINT_SLIDES)
    .map((s) => ({ kind: 'point', imageUrl: s.content.match(IMAGE_URL_RE)?.[1] ?? '', text: s.heading }))
    .filter((s) => s.imageUrl !== '')
  return [{ kind: 'cover', imageUrl: article.coverImageUrl, text: article.title }, ...pointSlides]
}

// ---- duplicated from src/lib/social/slideImage.ts ----
const WIDTH = 1080
const HEIGHT = 1350
const ACCENT = '#26A1B0'
const TEXT_ON_DARK = '#FFFFFF'

function wrapText(text, maxCharsPerLine, maxLines) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
    if (lines.length === maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildOverlaySvg(text, variant) {
  const fontSize = variant === 'cover' ? 64 : 48
  const maxChars = variant === 'cover' ? 18 : 22
  const lines = wrapText(text, maxChars, 3)
  const lineHeight = fontSize * 1.25
  const bottomPadding = 110
  const startY = HEIGHT - bottomPadding - (lines.length - 1) * lineHeight

  const tspans = lines.map((line, i) => `<tspan x="72" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`).join('')
  const accentBar =
    variant === 'point' ? `<rect x="72" y="${startY - fontSize - 24}" width="96" height="6" fill="${ACCENT}" />` : ''

  return `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stop-color="#0C1A1D" stop-opacity="0" />
          <stop offset="100%" stop-color="#0C1A1D" stop-opacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)" />
      ${accentBar}
      <text font-family="DejaVu Sans, sans-serif" font-weight="700" font-size="${fontSize}" fill="${TEXT_ON_DARK}">${tspans}</text>
    </svg>
  `
}

async function compositeSlideImage({ imageBuffer, text, variant }) {
  const resized = await sharp(imageBuffer).resize(WIDTH, HEIGHT, { fit: 'cover' }).toBuffer()
  const overlay = Buffer.from(buildOverlaySvg(text, variant))
  return sharp(resized).composite([{ input: overlay, top: 0, left: 0 }]).jpeg({ quality: 85 }).toBuffer()
}

// ---- duplicated from src/lib/images/storage.ts (persist a Buffer we already have, not a download) ----
async function persistBufferLocally(buffer) {
  const filename = `${randomUUID()}.jpg`
  await mkdir(UPLOADS_DIR, { recursive: true })
  await writeFile(path.join(UPLOADS_DIR, filename), buffer)
  return `${SITE_URL}/uploads/${filename}`
}

// ---- duplicated from src/lib/social/caption.ts ----
const CTA_LINE = 'Mau konsultasi gratis interior rumah/kantor di Batam? Chat kami via WhatsApp (link di bio) 📲'
const HASHTAGS = '#interiorbatam #desaininteriorbatam #kionixinterior #renovasirumahbatam'

function buildCaption({ hook, points }) {
  const bullets = points.slice(0, 3).map((p) => `✨ ${p}`)
  return [hook, '', ...bullets, '', CTA_LINE, '', HASHTAGS].join('\n')
}

// ---- duplicated from src/lib/social/zernio.ts ----
async function postToZernio(apiKey, payload) {
  const res = await fetch('https://zernio.com/api/v1/posts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Zernio post failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function readLocalImage(urlOrPath) {
  // urlOrPath is a site-relative path like /uploads/xxx.jpg
  const relative = urlOrPath.replace(/^\/+/, '')
  return readFile(path.join(__dirname, '..', 'public', relative))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null

  const zernioApiKey = process.env.ZERNIO_API_KEY
  if (!zernioApiKey) throw new Error('ZERNIO_API_KEY is not set')

  const sql = postgres(process.env.DATABASE_URL)

  const rows = await sql`
    select id, cover_image_url from articles
    where status = 'published' and social_posted_at is null
    order by created_at asc
    ${limit ? sql`limit ${limit}` : sql``}
  `

  console.log(`Found ${rows.length} article(s) needing a social post${dryRun ? ' (DRY RUN)' : ''}.`)

  for (const article of rows) {
    try {
      if (!article.cover_image_url) throw new Error('article has no cover_image_url, cannot build slides')

      const [translation] = await sql`
        select title, quick_answer, body from article_translations
        where article_id = ${article.id} and locale = 'id'
      `
      if (!translation) throw new Error('no id translation found')

      const slidePlan = buildSlidePlan({
        title: translation.title,
        coverImageUrl: article.cover_image_url,
        body: translation.body,
      })

      const imageUrls = []
      for (const slide of slidePlan) {
        const sourceBuffer = await readLocalImage(slide.imageUrl)
        const composited = await compositeSlideImage({ imageBuffer: sourceBuffer, text: slide.text, variant: slide.kind })
        imageUrls.push(dryRun ? '(dry-run, not persisted)' : await persistBufferLocally(composited))
      }
      // Static CTA slide, identical on every post.
      imageUrls.push(dryRun ? `${SITE_URL}/social/cta-slide.jpg (static)` : `${SITE_URL}/social/cta-slide.jpg`)

      const caption = buildCaption({
        hook: translation.quick_answer,
        points: slidePlan.filter((s) => s.kind === 'point').map((s) => s.text),
      })

      const payload = {
        content: caption,
        publishNow: true,
        timezone: 'Asia/Jakarta',
        profileId: ZERNIO_PROFILE_ID,
        platforms: [
          { platform: 'instagram', accountId: ZERNIO_IG_ACCOUNT_ID },
          {
            platform: 'tiktok',
            accountId: ZERNIO_TIKTOK_ACCOUNT_ID,
            // TikTok photo posts use the platform's content (customContent) as the
            // slideshow title, hard-capped at ~90 chars — Zernio rejects the whole
            // request otherwise, even with tiktokSettings.description set.
            customContent: translation.title.slice(0, 90),
          },
        ],
        mediaItems: imageUrls.map((url) => ({ type: 'image', url })),
        tiktokSettings: {
          privacy_level: ZERNIO_TIKTOK_PRIVACY_LEVEL,
          allow_comment: true,
          allow_duet: true,
          allow_stitch: true,
          commercial_content_type: 'none',
          content_preview_confirmed: true,
          express_consent_given: true,
          media_type: 'photo',
          // TikTok photo posts use `content` as the slideshow title (~90 char cap) —
          // `description` carries the full caption instead of getting rejected/truncated.
          description: caption,
          // Direct posting hit TikTok's "at capacity" gate for this account (confirmed
          // live 2026-08-26) — Zernio's own error names the fix: deliver via TikTok's
          // Creator Inbox instead. A human taps "Post" once per article in the TikTok
          // app; revisit direct posting if the account gets audited/capacity opens up.
          draft: true,
        },
      }

      console.log(`\n--- Article ${article.id} ---`)
      console.log('Caption:\n' + caption)
      console.log('Media items:', imageUrls)

      if (dryRun) {
        console.log('[dry-run] would POST to Zernio now, skipping.')
        continue
      }

      await postToZernio(zernioApiKey, payload)
      await sql`update articles set social_posted_at = now() where id = ${article.id}`
      console.log(`Posted article ${article.id} to Instagram + TikTok.`)
    } catch (err) {
      console.error(`Failed to post article ${article.id}, will retry next run: ${err.message}`)
    }
  }

  await sql.end()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
