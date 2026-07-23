'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { ChevronDown } from 'lucide-react'

const options = [
  { code: 'id', label: 'Indonesia' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
] as const

export default function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.code === locale) ?? options[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 font-sans font-semibold text-xs tracking-widest text-bg-dark hover:text-accent transition-colors"
      >
        {current.label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-32 rounded border border-border bg-white shadow-md">
          {options.map((o) => (
            <Link
              key={o.code}
              href={pathname}
              locale={o.code}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 font-sans text-xs ${
                o.code === locale ? 'font-bold text-accent' : 'text-bg-dark hover:text-accent'
              }`}
            >
              {o.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
