// Edge-runtime-safe: uses Web Crypto (crypto.subtle) instead of Node's `crypto` module,
// since this is imported from middleware.ts which runs on the Edge runtime.

export const SESSION_COOKIE_NAME = 'kionix_admin_session'

const encoder = new TextEncoder()

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

export async function createSessionToken(
  userId: string,
  secret: string,
  maxAgeSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  const exp = Date.now() + maxAgeSeconds * 1000
  const payload = `${userId}.${exp}`
  const key = await getKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return `${payload}.${toHex(signature)}`
}

export async function verifySessionToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userId, expStr, signatureHex] = parts

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return null

  const key = await getKey(secret)
  const payload = `${userId}.${expStr}`
  const signatureBytes = new Uint8Array(signatureHex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? [])
  const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(payload))

  return valid ? userId : null
}
