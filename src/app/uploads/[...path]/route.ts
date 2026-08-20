import path from 'path'
import { readFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { resolveUploadPath } from '@/lib/images/resolveUploadPath'

// Next's `output: 'standalone'` server only picks up files that were present under
// public/ when the server process started — files written later (by the admin CMS or
// scripts/daily-article.js, both via src/lib/images/storage.ts's persistImageLocally)
// 404 through the built-in public-folder handler until the process restarts. This route
// reads straight from disk on every request instead, so freshly-written uploads are
// servable immediately without a restart.
const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const filePath = resolveUploadPath(params.path)
  if (!filePath) return new NextResponse(null, { status: 400 })

  try {
    const buffer = await readFile(filePath)
    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
