import { buildBlogPostingJsonLd, buildLocalBusinessJsonLd, toJsonLdScript } from '@/lib/blog/jsonld'

const mockArticle = {
  title: 'Tips Kitchen Set Batam',
  slug: 'tips-kitchen-set-batam',
  locale: 'id',
  metaDescription: 'Ringkasan tips kitchen set di Batam.',
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-02T00:00:00.000Z'),
  coverImageUrl: null,
}

describe('buildBlogPostingJsonLd', () => {
  it('builds a valid BlogPosting shape', () => {
    const jsonld = buildBlogPostingJsonLd(mockArticle)
    expect(jsonld['@type']).toBe('BlogPosting')
    expect(jsonld.headline).toBe('Tips Kitchen Set Batam')
    expect(jsonld.author).toEqual({ '@type': 'Organization', name: 'Tim Kionix Interior' })
    expect(jsonld.datePublished).toBe('2026-08-01T00:00:00.000Z')
    expect(jsonld.dateModified).toBe('2026-08-02T00:00:00.000Z')
  })
})

describe('buildLocalBusinessJsonLd', () => {
  it('builds a valid LocalBusiness shape with the Batam address', () => {
    const jsonld = buildLocalBusinessJsonLd()
    expect(jsonld['@type']).toBe('LocalBusiness')
    expect(jsonld.address.addressLocality).toBe('Batam')
    expect(jsonld.telephone).toBe('+6281372703589')
  })
})

describe('toJsonLdScript', () => {
  it('escapes </script> so it cannot break out of the script tag', () => {
    const malicious = { headline: '</script><script>alert(1)</script>' }
    const script = toJsonLdScript(malicious)
    expect(script).not.toContain('</script>')
    expect(script).toContain('\\u003c/script>')
  })
})
