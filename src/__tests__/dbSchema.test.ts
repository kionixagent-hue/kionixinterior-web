import { articles, articleTranslations, topics } from '@/lib/db/schema'

describe('db schema', () => {
  it('articles table has expected columns', () => {
    expect('status' in articles).toBe(true)
    expect('tags' in articles).toBe(true)
    expect('coverImageUrl' in articles).toBe(true)
    expect('publishedAt' in articles).toBe(true)
  })

  it('articleTranslations table has expected columns', () => {
    expect('locale' in articleTranslations).toBe(true)
    expect('slug' in articleTranslations).toBe(true)
    expect('quickAnswer' in articleTranslations).toBe(true)
    expect('faq' in articleTranslations).toBe(true)
  })

  it('topics table has expected columns', () => {
    expect('keyword' in topics).toBe(true)
    expect('source' in topics).toBe(true)
    expect('status' in topics).toBe(true)
  })
})