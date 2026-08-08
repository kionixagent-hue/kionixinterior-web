'use client'

import { useState } from 'react'
import { splitSections, qualifyingSections, insertImageAfterSection, buildSectionImagePrompt } from '@/lib/images/sections'

type Props = {
  body: string
  onBodyChange: (nextBody: string) => void
  onGenerate: (prompt: string) => Promise<string>
  // Lets the caller disable the Body textarea while this runs — each image can take
  // up to ~60s, and this component tracks its own `currentBody` snapshot from
  // click-time, so a concurrent edit to `body` elsewhere would get silently
  // overwritten by the next insert. Disabling input during the run is simpler and
  // safer than trying to merge concurrent edits.
  onRunningChange?: (running: boolean) => void
}

export default function GenerateImagesButton({ body, onBodyChange, onGenerate, onRunningChange }: Props) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const qualifying = qualifyingSections(splitSections(body))

  async function handleClick() {
    setRunning(true)
    onRunningChange?.(true)
    setErrors([])

    // `qualifying` holds each section's start offset against the ORIGINAL `body`.
    // Inserting an image only ever appends at the END of a section's block (right
    // before the next heading), so it never touches any section's own content —
    // it just pushes every later section forward by however many characters were
    // added. Tracking that cumulative `shift` and applying it to each target's
    // start offset stays correct even if two sections share the same heading text
    // (unlike matching by heading, which would misresolve for duplicates).
    let currentBody = body
    let shift = 0
    const nextErrors: string[] = []

    for (let i = 0; i < qualifying.length; i++) {
      setProgress({ current: i + 1, total: qualifying.length })
      const target = qualifying[i]
      const section = { ...target, start: target.start + shift }

      try {
        const url = await onGenerate(buildSectionImagePrompt(section.heading))
        const beforeLength = currentBody.length
        currentBody = insertImageAfterSection(currentBody, section, `![${section.heading}](${url})`)
        shift += currentBody.length - beforeLength
        onBodyChange(currentBody)
      } catch {
        nextErrors.push(`Gagal membuat gambar untuk "${section.heading}".`)
      }
    }

    setErrors(nextErrors)
    setProgress(null)
    setRunning(false)
    onRunningChange?.(false)
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
