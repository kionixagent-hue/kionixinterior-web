import { shouldRedirectToLogin } from '@/lib/auth/authGuard'

describe('shouldRedirectToLogin', () => {
  it('redirects unauthenticated /admin requests', () => {
    expect(shouldRedirectToLogin('/admin', false)).toBe(true)
  })

  it('does not redirect the login page itself', () => {
    expect(shouldRedirectToLogin('/admin/login', false)).toBe(false)
  })

  it('does not redirect authenticated /admin requests', () => {
    expect(shouldRedirectToLogin('/admin', true)).toBe(false)
  })

  it('does not touch non-admin routes', () => {
    expect(shouldRedirectToLogin('/blog', false)).toBe(false)
  })
})
