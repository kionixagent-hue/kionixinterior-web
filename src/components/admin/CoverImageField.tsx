'use client'

import { useEffect, useState } from 'react'

type Props = {
  initialPrompt: string
  initialUrl?: string | null
  onGenerate: (prompt: string) => Promise<string>
  onGenerated?: (url: string) => void
}

type GenState = { status: 'idle' } | { status: 'running' } | { status: 'error'; error: string }

export default function CoverImageField({ initialPrompt, initialUrl, onGenerate, onGenerated }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [touched, setTouched] = useState(false)
  const [url, setUrl] = useState(initialUrl ?? null)
  const [gen, setGen] = useState<GenState>({ status: 'idle' })

  // Follow `initialPrompt` (e.g. a title/quick-answer-derived suggestion recomputed by
  // the parent as the admin types) until the admin edits this field directly — then
  // their edit wins and auto-suggestion stops overwriting it.
  useEffect(() => {
    if (!touched) setPrompt(initialPrompt)
  }, [initialPrompt, touched])

  async function handleGenerate() {
    setGen({ status: 'running' })
    try {
      const result = await onGenerate(prompt)
      setUrl(result)
      setGen({ status: 'idle' })
      onGenerated?.(result)
    } catch (err) {
      setGen({ status: 'error', error: err instanceof Error ? err.message : 'Gagal membuat gambar.' })
    }
  }

  return (
    <div className="flex flex-col gap-1 text-sm text-text-muted">
      <span>Cover Image</span>
      <div className="flex flex-col gap-2 rounded border border-border p-3">
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => {
            setTouched(true)
            setPrompt(e.target.value)
          }}
          className="rounded border border-border px-2 py-1 text-sm text-bg-dark outline-none focus:border-accent"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={gen.status === 'running' || !prompt.trim()}
            className="w-fit rounded border border-accent px-3 py-1 text-sm text-accent hover:bg-bg-section disabled:cursor-not-allowed disabled:opacity-50"
          >
            {gen.status === 'running' ? 'Membuat...' : url ? 'Regenerate' : 'Generate Cover'}
          </button>
          {gen.status === 'error' && (
            <span role="alert" className="text-xs text-red-600">
              {gen.error}
            </span>
          )}
        </div>
        {gen.status === 'running' && (
          <div className="flex aspect-video w-full animate-pulse items-center justify-center rounded border border-border bg-bg-section text-xs text-text-muted">
            Membuat gambar... (~5-30 detik)
          </div>
        )}
        {url && gen.status !== 'running' && (
          // eslint-disable-next-line @next/next/no-img-element -- remote snapgen.ai CDN URL, no next/image domain configured
          <img src={url} alt="Cover preview" className="aspect-video w-full rounded border border-border object-cover" />
        )}
      </div>
    </div>
  )
}
