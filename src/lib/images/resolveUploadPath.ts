import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// Resolves a route param's path segments to an absolute file path inside
// public/uploads, refusing anything that would escape that directory
// (e.g. ['..', '..', 'etc', 'passwd']).
export function resolveUploadPath(segments: string[]): string | null {
  const resolved = path.join(UPLOADS_DIR, ...segments)
  if (resolved !== UPLOADS_DIR && !resolved.startsWith(UPLOADS_DIR + path.sep)) return null
  return resolved
}
