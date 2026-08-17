import { writeFile, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

// snapgen.ai's `generate_result`/`image_url` are signed CDN URLs that expire (~7 days per
// the X-Amz-Expires seen on real responses) — download once and re-host locally so the
// URL stored in the DB never breaks. Served directly by Next.js's static /public handling,
// even in `output: 'standalone'` mode, since it reads the folder from disk at request time.
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function persistImageLocally(sourceUrl: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(sourceUrl)
  if (!res.ok) throw new Error(`failed to download image: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  const ext = extensionFor(res.headers.get('content-type'), sourceUrl)
  const filename = `${randomUUID()}${ext}`
  await mkdir(UPLOADS_DIR, { recursive: true })
  await writeFile(path.join(UPLOADS_DIR, filename), buffer)

  return `/uploads/${filename}`
}

function extensionFor(contentType: string | null, sourceUrl: string): string {
  if (contentType?.includes('png')) return '.png'
  if (contentType?.includes('webp')) return '.webp'
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg'
  const pathExt = path.extname(new URL(sourceUrl).pathname)
  return pathExt || '.jpg'
}
