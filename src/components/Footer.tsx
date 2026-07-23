import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { INSTAGRAM_URL, TIKTOK_URL } from '@/lib/constants'

const navKeys = ['layanan', 'portfolio', 'tentang', 'kontak'] as const
const navHrefs: Record<(typeof navKeys)[number], string> = {
  layanan: '#layanan',
  portfolio: '#portfolio',
  tentang: '#tentang',
  kontak: '#kontak',
}

export default async function Footer() {
  const t = await getTranslations('nav')

  return (
    <footer className="bg-bg-dark px-5 py-10 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="relative h-16 w-16">
            <Image src="/logo.png" alt="Kionix Interior" fill className="object-contain brightness-0 invert" />
          </div>
          <nav className="flex flex-wrap gap-8">
            {navKeys.map((key) => (
              <a
                key={key}
                href={navHrefs[key]}
                className="font-sans font-medium text-sm text-text-on-dark hover:text-accent transition-colors"
              >
                {t(key)}
              </a>
            ))}
          </nav>

          <div className="flex gap-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Kionix Interior"
              className="text-text-on-dark hover:text-accent transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok Kionix Interior"
              className="text-text-on-dark hover:text-accent transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-6 h-px bg-white/10" />

        <div className="mt-5 flex flex-col gap-2 md:flex-row md:justify-between">
          <p className="font-sans text-xs text-text-on-dark">© 2025 Kionix Interior. Batam.</p>
          <p className="font-sans text-xs text-text-on-dark">Ruko Ciptaland Blok Lavender No.26, Batam</p>
        </div>
      </div>
    </footer>
  )
}
