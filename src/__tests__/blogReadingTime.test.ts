import { computeReadingTime } from '@/lib/blog/readingTime'

describe('computeReadingTime', () => {
  it('computes minutes at 200 words per minute', () => {
    expect(computeReadingTime('word '.repeat(400))).toBe(2)
  })

  it('rounds up partial minutes', () => {
    expect(computeReadingTime('word '.repeat(201))).toBe(2)
  })

  it('returns at least 1 minute for an empty body', () => {
    expect(computeReadingTime('')).toBe(1)
  })
})
