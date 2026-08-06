'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import TagFilter from './TagFilter'
import { WHATSAPP_URL } from '@/lib/constants'

export type BlogIndexArticle = {
  id: string
  slug: string
  title: string
  quickAnswer: string
  tags: string[]
  status: 'draft' | 'in_review' | 'published'
  publishedAt: string | null
}

// md:grid-cols-3 → index 5 is the end of the 2nd full row of "rest" tiles
const CTA_BAND_AFTER_INDEX = 5

export default function BlogIndex({
  articles,
  activeTag = null,
}: {
  articles: BlogIndexArticle[]
  activeTag?: string | null
}) {
  const t = useTranslations('blog')

  const published = articles.filter((a) => a.status === 'published')
  const allTags = Array.from(new Set(published.flatMap((a) => a.tags))).sort()
  const filtered = activeTag ? published.filter((a) => a.tags.includes(activeTag)) : published
  const [featured, ...rest] = filtered

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <span className="font-sans text-xs font-semibold uppercase tracking-[1.32px] text-accent">{t('eyebrow')}</span>
      <h1 className="mb-6 mt-2 font-serif text-4xl font-bold text-bg-dark">{t('title')}</h1>

      <TagFilter tags={allTags} activeTag={activeTag} />

      {filtered.length === 0 ? (
        <p className="mt-8 text-text-muted">{t('empty')}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group flex flex-col justify-end gap-3 rounded-xl border border-border bg-bg-section p-8 md:col-span-3 md:min-h-[280px]"
            >
              {featured.tags[0] && (
                <span className="font-sans text-xs font-semibold uppercase tracking-wide text-accent">
                  {featured.tags[0]}
                </span>
              )}
              <h2 className="font-serif text-3xl font-bold text-bg-dark group-hover:text-accent">{featured.title}</h2>
              <p className="max-w-2xl font-sans text-sm text-text-muted">{featured.quickAnswer}</p>
            </Link>
          )}

          {rest.map((article, i) => (
            <Fragment key={article.id}>
              <Link
                href={`/blog/${article.slug}`}
                className="group flex flex-col gap-2 rounded-xl border border-border p-5 hover:border-accent"
              >
                {article.tags[0] && (
                  <span className="font-sans text-xs font-semibold uppercase tracking-wide text-accent">
                    {article.tags[0]}
                  </span>
                )}
                <h3 className="font-serif text-xl font-bold text-bg-dark group-hover:text-accent">{article.title}</h3>
                <p className="font-sans text-sm text-text-muted">{article.quickAnswer}</p>
              </Link>

              {i === CTA_BAND_AFTER_INDEX && (
                <div className="flex flex-col items-start justify-center gap-3 rounded-xl bg-bg-dark p-8 text-text-on-dark md:col-span-3">
                  <h3 className="font-serif text-2xl font-bold">{t('ctaBandTitle')}</h3>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-accent px-5 py-2.5 font-sans font-bold hover:bg-accent-hover"
                  >
                    {t('ctaBandButton')}
                  </a>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  )
}
