'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export default function TagFilter({ tags, activeTag }: { tags: string[]; activeTag: string | null }) {
  const t = useTranslations('blog')
  const router = useRouter()
  const pathname = usePathname()

  function setTag(tag: string | null) {
    router.push(tag ? `${pathname}?tag=${encodeURIComponent(tag)}` : pathname)
  }

  return (
    <nav aria-label={t('filterAll')} className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => setTag(null)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          !activeTag ? 'bg-accent text-text-on-dark' : 'border border-border text-text-muted hover:border-accent'
        }`}
      >
        {t('filterAll')}
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => setTag(tag)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            activeTag === tag ? 'bg-accent text-text-on-dark' : 'border border-border text-text-muted hover:border-accent'
          }`}
        >
          {tag}
        </button>
      ))}
    </nav>
  )
}
