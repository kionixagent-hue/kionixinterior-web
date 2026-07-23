'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { WHATSAPP_URL } from '@/lib/constants'
import { trackWaClick } from '@/lib/trackWaClick'

export function openWaModal(source: string) {
  window.dispatchEvent(new CustomEvent('open-wa-modal', { detail: { source } }))
}

export default function WaLeadModal() {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const handler = (e: Event) => {
      setSource((e as CustomEvent<{ source: string }>).detail.source)
      setOpen(true)
    }
    window.addEventListener('open-wa-modal', handler)
    return () => window.removeEventListener('open-wa-modal', handler)
  }, [])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedName || !trimmedPhone) return

    trackWaClick(source, { name: trimmedName, phone: trimmedPhone })
    const text = encodeURIComponent(`Halo Kionix, saya ${trimmedName}, ingin konsultasi`)
    window.open(`${WHATSAPP_URL}?text=${text}`, '_blank', 'noopener,noreferrer')

    setOpen(false)
    setName('')
    setPhone('')
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5"
      onClick={() => setOpen(false)}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 className="font-serif text-xl font-bold text-bg-dark">Mulai Konsultasi</h3>
        <p className="mt-1 font-sans text-sm text-text-muted">
          Isi data Anda, kami lanjutkan di WhatsApp.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Nama Anda"
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded border border-border px-4 py-2.5 font-sans text-sm text-bg-dark outline-none focus:border-accent"
          />
          <input
            type="tel"
            required
            placeholder="No. WhatsApp"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="rounded border border-border px-4 py-2.5 font-sans text-sm text-bg-dark outline-none focus:border-accent"
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded border border-border py-2.5 font-sans text-sm font-semibold text-bg-dark"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-1 rounded bg-accent py-2.5 font-sans text-sm font-bold text-text-on-dark transition-colors hover:bg-accent-hover"
          >
            Lanjut →
          </button>
        </div>
      </form>
    </div>
  )
}
