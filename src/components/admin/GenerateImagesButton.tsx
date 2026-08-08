'use client'

import { useState } from 'react'
import { splitSections, qualifyingSections, insertImageAfterSection, buildSectionImagePrompt } from '@/lib/images/sections'

type Props = {
  body: string
  onBodyChange: (nextBody: string) => void
  onGenerate: (prompt: string) => Promise<string>
}

export default function GenerateImagesButton({ body, onBodyChange, onGenerate }: Props) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const qualifying = qualifyingSections(splitSections(body))

  async function handleClick() {
    setRunning(true)
    setErrors([])

    // Snapshot which headings to illustrate and in what order, but re-parse the body
    // fresh before each insert — earlier inserts shift character offsets for every
    // section after them, so reusing a Section object computed before the loop
    // started would insert at a stale position.
    const headings = qualifying.map((s) => s.heading)
    let currentBody = body
    const nextErrors: string[] = []

    for (let i = 0; i < headings.length; i++) {
      setProgress({ current: i + 1, total: headings.length })
      const heading = headings[i]
      const freshSection = splitSections(currentBody).find((s) => s.heading === heading && !s.hasImage)
      if (!freshSection) continue

      try {
        const url = await onGenerate(buildSectionImagePrompt(heading))
        currentBody = insertImageAfterSection(currentBody, freshSection, `![${heading}](${url})`)
        onBodyChange(currentBody)
      } catch {
        nextErrors.push(`Gagal membuat gambar untuk "${heading}".`)
      }
    }

    setErrors(nextErrors)
    setProgress(null)
    setRunning(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={running || qualifying.length === 0}
        className="w-fit rounded border border-accent px-3 py-1 text-sm text-accent hover:bg-bg-section disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running && progress ? `Generating image ${progress.current} of ${progress.total}...` : 'Generate Images'}
      </button>
      {errors.length > 0 && (
        <ul aria-live="polite" className="flex flex-col gap-0.5 text-xs text-red-600">
          {errors.map((e, i) => (
            <li key={i} role="alert">
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
