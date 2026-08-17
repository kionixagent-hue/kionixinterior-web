import { notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import ReactMarkdown from 'react-markdown'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { db } from '@/lib/db/client'
import { articles, articleTranslations } from '@/lib/db/schema'
import { computeReadingTime } from '@/lib/blog/readingTime'
import { buildBlogPostingJsonLd, buildLocalBusinessJsonLd, toJsonLdScript } from '@/lib/blog/jsonld'
import QuickAnswerBox from '@/components/QuickAnswerBox'
import FaqAccordion from '@/components/FaqAccordion'
import { WHATSAPP_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

async function getArticle(locale: string, slug: string) {
  if (locale !== 'id' && locale !== 'en') return null

  const rows = await db
    .select({
      translation: articleTranslations,
      article: articles,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
    .where(
      and(
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.slug, slug),
        eq(articles.status, 'published')
      )
    )
    .limit(1)

  return rows[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const row = await getArticle(locale, slug)
  if (!row) return {}

  return {
    title: row.translation.title,
    description: row.translation.metaDescription,
    openGraph: {
      title: row.translation.title,
      description: row.translation.metaDescription,
      type: 'article',
      publishedTime: row.article.createdAt.toISOString(),
      modifiedTime: row.article.updatedAt.toISOString(),
      images: row.article.coverImageUrl ? [row.article.coverImageUrl] : undefined,
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params
  const row = await getArticle(locale, slug)
  if (!row) notFound()

  const t = await getTranslations({ locale, namespace: 'hero' })
  const { translation, article } = row
  const readingTime = computeReadingTime(translation.body)
  const blogPostingJsonLd = buildBlogPostingJsonLd({
    title: translation.title,
    slug: translation.slug,
    locale,
    metaDescription: translation.metaDescription,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    coverImageUrl: article.coverImageUrl,
  })
  const localBusinessJsonLd = buildLocalBusinessJsonLd()

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdScript(blogPostingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdScript(localBusinessJsonLd) }} />

      <div className="mb-6 flex flex-wrap items-center gap-3 font-sans text-sm text-text-muted">
        <time dateTime={article.createdAt.toISOString()}>
          {article.createdAt.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{readingTime} min</span>
        {article.tags.length > 0 && (
          <>
            <span>·</span>
            <span>{article.tags.join(', ')}</span>
          </>
        )}
      </div>

      <h1 className="mb-6 font-serif text-4xl font-bold text-bg-dark">{translation.title}</h1>

      {article.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- remote snapgen.ai CDN URL, no next/image domain configured
        <img
          src={article.coverImageUrl}
          alt={translation.title}
          className="mb-8 aspect-video w-full rounded-xl border border-border object-cover"
        />
      )}

      <QuickAnswerBox text={translation.quickAnswer} />

      <article className="mt-8 flex flex-col gap-4 font-sans text-base leading-relaxed text-bg-dark [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold">
        <ReactMarkdown>{translation.body}</ReactMarkdown>
      </article>

      {translation.faq.length > 0 && (
        <section aria-label="FAQ" className="mt-10">
          <FaqAccordion items={translation.faq} />
        </section>
      )}

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex w-fit items-center rounded bg-accent px-8 py-4 font-sans font-bold text-text-on-dark hover:bg-accent-hover"
      >
        {t('cta')}
      </a>
    </main>
  )
}
