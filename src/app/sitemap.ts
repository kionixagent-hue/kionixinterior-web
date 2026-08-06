import type { MetadataRoute } from 'next'
import { eq, and } from 'drizzle-orm'
import { routing } from '@/i18n/routing'
import { db } from '@/lib/db/client'
import { articles, articleTranslations } from '@/lib/db/schema'

const base = 'https://kionixinterior.com'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? base : `${base}/${locale}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, l === routing.defaultLocale ? base : `${base}/${l}`])
      ),
    },
  }))

  const publishedArticles = await db
    .select({
      locale: articleTranslations.locale,
      slug: articleTranslations.slug,
      updatedAt: articles.updatedAt,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
    .where(and(eq(articles.status, 'published')))

  const articleEntries: MetadataRoute.Sitemap = publishedArticles.map(({ locale, slug, updatedAt }) => ({
    url: locale === routing.defaultLocale ? `${base}/blog/${slug}` : `${base}/${locale}/blog/${slug}`,
    lastModified: updatedAt,
  }))

  return [...homeEntries, ...articleEntries]
}
