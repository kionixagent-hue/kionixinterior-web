'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDraftArticle, type TranslationInput } from '@/app/admin/actions'

type FaqRow = { q: string; a: string }
type LocaleForm = Omit<TranslationInput, 'locale' | 'faq'> & { faq: FaqRow[] }

const EMPTY_LOCALE_FORM: LocaleForm = { title: '', quickAnswer: '', body: '', metaDescription: '', faq: [] }

function LocaleFieldset({
  label,
  value,
  onChange,
}: {
  label: string
  value: LocaleForm
  onChange: (next: LocaleForm) => void
}) {
  function updateFaq(index: number, key: keyof FaqRow, text: string) {
    const faq = value.faq.map((row, i) => (i === index ? { ...row, [key]: text } : row))
    onChange({ ...value, faq })
  }

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <legend className="px-1 font-serif text-lg font-semibold text-bg-dark">{label}</legend>

      <label className="flex flex-col gap-1 text-sm text-text-muted">
        Judul
        <input
          required
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-muted">
        Quick Answer (2-3 kalimat)
        <textarea
          required
          rows={2}
          value={value.quickAnswer}
          onChange={(e) => onChange({ ...value, quickAnswer: e.target.value })}
          className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-muted">
        Body (markdown)
        <textarea
          required
          rows={10}
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          className="rounded border border-border px-3 py-2 font-mono text-sm text-bg-dark outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-muted">
        Meta Description
        <input
          required
          value={value.metaDescription}
          onChange={(e) => onChange({ ...value, metaDescription: e.target.value })}
          className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">FAQ</span>
        {value.faq.map((row, i) => (
          <div key={i} className="flex flex-col gap-1 rounded border border-border p-3">
            <input
              placeholder="Pertanyaan"
              value={row.q}
              onChange={(e) => updateFaq(i, 'q', e.target.value)}
              className="rounded border border-border px-2 py-1 text-sm text-bg-dark outline-none focus:border-accent"
            />
            <input
              placeholder="Jawaban"
              value={row.a}
              onChange={(e) => updateFaq(i, 'a', e.target.value)}
              className="rounded border border-border px-2 py-1 text-sm text-bg-dark outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => onChange({ ...value, faq: value.faq.filter((_, idx) => idx !== i) })}
              className="w-fit text-xs text-text-muted hover:text-accent"
            >
              Hapus
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...value, faq: [...value.faq, { q: '', a: '' }] })}
          className="w-fit rounded border border-accent px-3 py-1 text-sm text-accent hover:bg-bg-section"
        >
          + Tambah FAQ
        </button>
      </div>
    </fieldset>
  )
}

export default function NewArticlePage() {
  const router = useRouter()
  const [tags, setTags] = useState('')
  const [id, setId] = useState<LocaleForm>(EMPTY_LOCALE_FORM)
  const [en, setEn] = useState<LocaleForm>(EMPTY_LOCALE_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const articleId = await createDraftArticle({
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        translations: [
          { locale: 'id', ...id },
          { locale: 'en', ...en },
        ],
      })
      router.push(`/admin/${articleId}`)
    } catch {
      setError('Gagal menyimpan draft. Coba lagi.')
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-8 font-serif text-3xl font-semibold text-bg-dark">Artikel Baru</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-text-muted">
          Tag (pisahkan dengan koma)
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="kitchen-set, tips, batam"
            className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
          />
        </label>

        <LocaleFieldset label="Bahasa Indonesia" value={id} onChange={setId} />
        <LocaleFieldset label="English" value={en} onChange={setEn} />

        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-accent px-6 py-3 font-sans font-bold text-text-on-dark hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Draft'}
        </button>
      </form>
    </main>
  )
}
