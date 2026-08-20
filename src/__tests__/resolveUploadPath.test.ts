import path from 'path'
import { resolveUploadPath } from '@/lib/images/resolveUploadPath'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

describe('resolveUploadPath', () => {
  it('resolves a plain filename inside the uploads dir', () => {
    expect(resolveUploadPath(['abc-123.png'])).toBe(path.join(UPLOADS_DIR, 'abc-123.png'))
  })

  it('rejects path traversal attempts', () => {
    expect(resolveUploadPath(['..', '..', 'etc', 'passwd'])).toBeNull()
  })

  it('rejects a single segment containing traversal', () => {
    expect(resolveUploadPath(['..%2f..%2fetc%2fpasswd'])).not.toBeNull() // URL-encoded, harmless as a literal filename
    expect(resolveUploadPath(['..'])).toBeNull()
  })
})
