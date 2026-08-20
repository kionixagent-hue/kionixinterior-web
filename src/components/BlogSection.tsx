import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { articles, articleTranslations } from '@/lib/db/schema'

export default async function BlogSection() {
  const locale = await getLocale()
  if (locale !== 'id' && locale !== 'en') return null

  const rows = await db
    .select({
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      quickAnswer: articleTranslations.quickAnswer,
      coverImageUrl: articles.coverImageUrl,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
    .where(and(eq(articleTranslations.locale, locale), eq(articles.status, 'published')))
    .orderBy(desc(articles.publishedAt))
    .limit(3)

  if (rows.length === 0) return null

  const t = await getTranslations('blogSection')
  const blogPrefix = locale === 'id' ? '/blog' : `/${locale}/blog`

  return (
    <section id="blog" className="bg-white px-5 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-serif text-5xl font-bold text-bg-dark">{t('title')}</h2>
          <div className="h-0.5 w-12 bg-accent" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Link
              key={row.slug}
              href={`${blogPrefix}/${row.slug}`}
              className="group flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-bg-section transition-colors hover:border-accent"
            >
              {row.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.coverImageUrl} alt={row.title} className="h-44 w-full object-cover" />
              )}
              <div className="flex flex-col gap-3 p-7 pt-0 first:pt-7">
                <h3 className="font-serif text-xl font-bold text-bg-dark group-hover:text-accent">{row.title}</h3>
                <p className="font-sans text-sm text-text-muted">{row.quickAnswer}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={blogPrefix}
            className="rounded bg-accent px-6 py-3 font-sans font-bold text-text-on-dark transition-colors hover:bg-accent-hover"
          >
            {t('cta')}
          </Link>
        </div>
      </div>
    </section>
  )
}
