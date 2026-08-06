/**
 * @jest-environment node
 */
import { createSessionToken, verifySessionToken } from '@/lib/auth/session'

const SECRET = 'test-session-secret'

describe('session token', () => {
  it('round-trips: a token created for a user verifies back to that user', async () => {
    const token = await createSessionToken('user-123', SECRET)
    const userId = await verifySessionToken(token, SECRET)
    expect(userId).toBe('user-123')
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await createSessionToken('user-123', SECRET)
    const userId = await verifySessionToken(token, 'wrong-secret')
    expect(userId).toBeNull()
  })

  it('rejects a tampered token', async () => {
    const token = await createSessionToken('user-123', SECRET)
    const tampered = token.replace('user-123', 'user-999')
    const userId = await verifySessionToken(tampered, SECRET)
    expect(userId).toBeNull()
  })

  it('rejects an expired token', async () => {
    const token = await createSessionToken('user-123', SECRET, -1) // already expired
    const userId = await verifySessionToken(token, SECRET)
    expect(userId).toBeNull()
  })

  it('rejects garbage input', async () => {
    expect(await verifySessionToken('not-a-real-token', SECRET)).toBeNull()
  })
})
