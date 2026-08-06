import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('password hashing', () => {
  it('verifies a correct password against its hash', () => {
    const hash = hashPassword('correct horse battery staple')
    expect(verifyPassword('correct horse battery staple', hash)).toBe(true)
  })

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct horse battery staple')
    expect(verifyPassword('wrong password', hash)).toBe(false)
  })

  it('produces a different hash each time (random salt)', () => {
    const hash1 = hashPassword('same password')
    const hash2 = hashPassword('same password')
    expect(hash1).not.toBe(hash2)
    expect(verifyPassword('same password', hash1)).toBe(true)
    expect(verifyPassword('same password', hash2)).toBe(true)
  })
})
