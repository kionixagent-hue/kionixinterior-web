import { buildArticlePrompt } from '@/lib/articleGen/buildPrompt'

describe('buildArticlePrompt', () => {
  it('embeds the topic keyword and brand/locale context', () => {
    const prompt = buildArticlePrompt('warna cat interior tropis')
    expect(prompt).toContain('warna cat interior tropis')
    expect(prompt).toContain('Kionix Interior')
    expect(prompt).toContain('Batam')
  })

  it('directs both the content and its visual style toward modern minimalist', () => {
    const prompt = buildArticlePrompt('storage kecil')
    expect(prompt.toLowerCase()).toContain('modern minimalis')
  })

  it('specifies the JSON contract keys the parser depends on', () => {
    const prompt = buildArticlePrompt('storage kecil')
    expect(prompt).toContain('"id"')
    expect(prompt).toContain('"en"')
    expect(prompt).toContain('"tags"')
    expect(prompt).toContain('"faq"')
  })
})
