import { needsSocialPost } from '@/lib/social/eligibility'

describe('needsSocialPost', () => {
  it('is true for a published article never posted to social', () => {
    expect(needsSocialPost({ status: 'published', socialPostedAt: null })).toBe(true)
  })

  it('is false once already posted', () => {
    expect(needsSocialPost({ status: 'published', socialPostedAt: new Date('2026-08-26') })).toBe(false)
  })

  it('is false for draft articles', () => {
    expect(needsSocialPost({ status: 'draft', socialPostedAt: null })).toBe(false)
  })

  it('is false for in_review articles', () => {
    expect(needsSocialPost({ status: 'in_review', socialPostedAt: null })).toBe(false)
  })
})
