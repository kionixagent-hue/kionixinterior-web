'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { openWaModal } from '@/components/WaLeadModal'
import LocaleSwitcher from '@/components/LocaleSwitcher'

const navKeys = ['layanan', 'portfolio', 'tentang', 'kontak'] as const
const navHrefs: Record<(typeof navKeys)[number], string> = {
  layanan: '#layanan',
  portfolio: '#portfolio',
  tentang: '#tentang',
  kontak: '#kontak',
}

export default function Navbar() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 md:px-20 h-16 transition-all duration-200 ${
        scrolled
          ? 'backdrop-blur-md bg-white/90 shadow-sm border-b border-border'
          : 'bg-white border-b border-border'
      }`}
    >
      <Link href="/" className="relative w-12 h-12 shrink-0">
        <Image src="/logo.png" alt="Kionix Interior" fill className="object-contain" priority />
      </Link>

      <ul className="hidden md:flex gap-10 items-center">
        {navKeys.map((key) => (
          <li key={key}>
            <a
              href={navHrefs[key]}
              className="font-sans font-semibold text-xs tracking-widest text-bg-dark hover:text-accent transition-colors"
            >
              {t(key)}
            </a>
          </li>
        ))}
      </ul>

      <div className="hidden md:flex items-center gap-6">
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => openWaModal('navbar-desktop')}
          className="inline-flex items-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-xs px-6 py-3 rounded transition-colors"
        >
          {t('cta')}
        </button>
      </div>

      <button
        className="md:hidden p-2 text-bg-dark"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div className="absolute top-16 inset-x-0 bg-white border-b border-border shadow-md md:hidden">
          <ul className="flex flex-col py-4">
            {navKeys.map((key) => (
              <li key={key}>
                <a
                  href={navHrefs[key]}
                  className="block px-5 py-3 font-sans font-semibold text-xs tracking-widest text-bg-dark hover:text-accent"
                  onClick={() => setOpen(false)}
                >
                  {t(key)}
                </a>
              </li>
            ))}
            <li className="px-5 pt-3">
              <LocaleSwitcher />
            </li>
            <li className="px-5 pt-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  openWaModal('navbar-mobile')
                }}
                className="block w-full text-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-xs px-6 py-3 rounded transition-colors"
              >
                {t('cta')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
