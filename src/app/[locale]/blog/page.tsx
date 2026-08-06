import { notFound } from 'next/navigation'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { articles, articleTranslations } from '@/lib/db/schema'
import BlogIndex, { type BlogIndexArticle } from '@/components/BlogIndex'

export const dynamic = 'force-dynamic'

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string }>
}) {
  const { locale } = await params
  const { tag } = await searchParams

  if (locale !== 'id' && locale !== 'en') notFound()

  const rows = await db
    .select({
      id: articles.id,
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      quickAnswer: articleTranslations.quickAnswer,
      tags: articles.tags,
      status: articles.status,
      publishedAt: articles.publishedAt,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
    .where(and(eq(articleTranslations.locale, locale), eq(articles.status, 'published')))
    .orderBy(desc(articles.publishedAt))

  const blogArticles: BlogIndexArticle[] = rows.map((row) => ({
    ...row,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  }))

  return <BlogIndex articles={blogArticles} activeTag={tag ?? null} />
}
