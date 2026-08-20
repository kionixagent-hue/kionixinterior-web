import { generateSlug, uniqueSlug } from '@/lib/blog/slug'

describe('generateSlug', () => {
  it('slugifies a title', () => {
    expect(generateSlug('Tips Interior Minimalis Batam!')).toBe('tips-interior-minimalis-batam')
  })

  it('collapses repeated separators and trims edges', () => {
    expect(generateSlug('  Kitchen Set -- Custom!!  ')).toBe('kitchen-set-custom')
  })

  it('does not crash on an empty title', () => {
    expect(generateSlug('')).toBe('')
  })
})

describe('uniqueSlug', () => {
  it('returns the base slug unchanged when there is no collision', () => {
    expect(uniqueSlug('foo', [])).toBe('foo')
  })

  it('appends the next free numeric suffix on collision', () => {
    expect(uniqueSlug('kitchen-set', ['kitchen-set', 'kitchen-set-2'])).toBe('kitchen-set-3')
  })
})
