'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import ArticleStatusBadge, { type ArticleStatus } from '@/components/admin/ArticleStatusBadge'
import {
  updateArticleTranslation,
  publishArticle,
  rejectArticle,
  updateCoverImage,
  generateCoverImage,
  generateBodySectionImage,
} from '@/app/admin/actions'
import { buildCoverPrompt } from '@/lib/images/sections'
import CoverImageField from '@/components/admin/CoverImageField'
import GenerateImagesButton from '@/components/admin/GenerateImagesButton'

type FaqRow = { q: string; a: string }
type Translation = {
  locale: 'id' | 'en'
  title: string
  quickAnswer: string
  body: string
  metaDescription: string
  faq: FaqRow[]
}
type Article = {
  id: string
  status: ArticleStatus
  coverImageUrl: string | null
  translations: Translation[]
}

export default function EditForm({ article }: { article: Article }) {
  const router = useRouter()
  const [activeLocale, setActiveLocale] = useState<'id' | 'en'>('id')
  const [forms, setForms] = useState<Record<'id' | 'en', Translation | undefined>>({
    id: article.translations.find((t) => t.locale === 'id'),
    en: article.translations.find((t) => t.locale === 'en'),
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState(article.coverImageUrl)
  const [coverSaveError, setCoverSaveError] = useState<string | null>(null)
  const [bodyGenerating, setBodyGenerating] = useState(false)

  const current = forms[activeLocale]
  const idTranslation = forms.id
  const coverPrompt = buildCoverPrompt(idTranslation?.title ?? '', idTranslation?.quickAnswer ?? '')

  async function handleCoverGenerated(url: string) {
    setCoverImageUrl(url)
    setCoverSaveError(null)
    try {
      await updateCoverImage(article.id, url)
    } catch {
      // CoverImageField already shows the new image locally — without this, a failed
      // persist (expired session, DB error) would look saved when it wasn't.
      setCoverSaveError('Gambar berhasil dibuat tapi gagal disimpan. Coba klik Regenerate lagi.')
    }
  }

  function updateCurrent(fields: Partial<Translation>) {
    setForms((prev) => ({ ...prev, [activeLocale]: prev[activeLocale] ? { ...prev[activeLocale]!, ...fields } : prev[activeLocale] }))
  }

  async function handleSave() {
    if (!current) return
    setSaving(true)
    setMessage(null)
    try {
      await updateArticleTranslation(article.id, activeLocale, {
        title: current.title,
        quickAnswer: current.quickAnswer,
        body: current.body,
        metaDescription: current.metaDescription,
        faq: current.faq,
      })
      setMessage('Tersimpan.')
    } catch {
      setMessage('Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    await publishArticle(article.id)
    router.refresh()
  }

  async function handleReject() {
    await rejectArticle(article.id)
    router.refresh()
  }

  if (!current) {
    return <p className="mx-auto max-w-5xl px-5 py-12 text-text-muted">Terjemahan {activeLocale} tidak ditemukan.</p>
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold text-bg-dark">{current.title || '(tanpa judul)'}</h1>
          <ArticleStatusBadge status={article.status} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="rounded border border-text-muted px-4 py-2 text-sm text-text-muted hover:border-accent hover:text-accent"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="rounded bg-accent px-4 py-2 text-sm font-bold text-text-on-dark hover:bg-accent-hover"
          >
            Approve & Publish
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(['id', 'en'] as const).map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`rounded px-3 py-1 text-sm font-semibold ${
              activeLocale === locale ? 'bg-accent text-text-on-dark' : 'border border-border text-text-muted'
            }`}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <CoverImageField
          initialPrompt={coverPrompt}
          initialUrl={coverImageUrl}
          onGenerate={generateCoverImage}
          onGenerated={handleCoverGenerated}
        />
        {coverSaveError && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {coverSaveError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Judul
            <input
              value={current.title}
              onChange={(e) => updateCurrent({ title: e.target.value })}
              className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Quick Answer
            <textarea
              rows={2}
              value={current.quickAnswer}
              onChange={(e) => updateCurrent({ quickAnswer: e.target.value })}
              className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Body (markdown)
            <textarea
              rows={16}
              value={current.body}
              onChange={(e) => updateCurrent({ body: e.target.value })}
              readOnly={bodyGenerating}
              className={`rounded border border-border px-3 py-2 font-mono text-sm text-bg-dark outline-none focus:border-accent ${bodyGenerating ? 'opacity-50' : ''}`}
            />
          </label>

          <GenerateImagesButton
            body={current.body}
            onBodyChange={(body) => updateCurrent({ body })}
            onGenerate={generateBodySectionImage}
            onRunningChange={setBodyGenerating}
          />

          <label className="flex flex-col gap-1 text-sm text-text-muted">
            Meta Description
            <input
              value={current.metaDescription}
              onChange={(e) => updateCurrent({ metaDescription: e.target.value })}
              className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-fit rounded bg-accent px-5 py-2 font-sans font-bold text-text-on-dark hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            {message && <span className="text-sm text-text-muted">{message}</span>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-section p-6">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-text-muted">Preview</span>
          <div className="border-l-[3px] border-accent bg-white p-4 font-sans text-sm text-bg-dark">
            {current.quickAnswer}
          </div>
          <article className="mt-6 flex flex-col gap-3 font-sans text-sm leading-relaxed text-bg-dark [&_h1]:font-serif [&_h1]:text-2xl [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-serif [&_h3]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold">
            <ReactMarkdown>{current.body}</ReactMarkdown>
          </article>
        </div>
      </div>
    </main>
  )
}
