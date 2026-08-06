import { nextStatus } from '@/lib/blog/status'

describe('nextStatus', () => {
  it('publish from draft goes to published', () => {
    expect(nextStatus('publish', 'draft')).toBe('published')
  })

  it('publish from in_review goes to published', () => {
    expect(nextStatus('publish', 'in_review')).toBe('published')
  })

  it('reject from in_review goes back to draft', () => {
    expect(nextStatus('reject', 'in_review')).toBe('draft')
  })

  it('reject from draft stays draft', () => {
    expect(nextStatus('reject', 'draft')).toBe('draft')
  })
})
