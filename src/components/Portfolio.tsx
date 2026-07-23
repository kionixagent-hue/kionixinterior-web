'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const projectKeys = [
  'kitchenSet', 'kamarTidur', 'ruangTamu', 'kantorModern', 'backdropTv',
  'retailBooth', 'lemariCustom', 'apartemen', 'renovasi',
] as const

const projectImages: Record<(typeof projectKeys)[number], string> = {
  kitchenSet: '/images/portfolio/kitchen-set.jpg',
  kamarTidur: '/images/portfolio/bedroom.jpg',
  ruangTamu: '/images/portfolio/living-room.jpg',
  kantorModern: '/images/portfolio/office.jpg',
  backdropTv: '/images/portfolio/backdrop-tv.jpg',
  retailBooth: '/images/portfolio/retail-booth.jpg',
  lemariCustom: '/images/portfolio/lemari-custom.jpg',
  apartemen: '/images/portfolio/apartment.jpg',
  renovasi: '/images/portfolio/project.jpg',
}

export default function Portfolio() {
  const t = useTranslations('portfolio')
  const [selectedKey, setSelectedKey] = useState<(typeof projectKeys)[number] | null>(null)

  useEffect(() => {
    if (!selectedKey) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedKey(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedKey])

  return (
    <section id="portfolio" className="bg-white px-5 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-serif text-5xl font-bold text-bg-dark">{t('title')}</h2>
          <div className="h-0.5 w-12 bg-accent" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectKeys.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className="relative h-64 overflow-hidden rounded-lg group text-left"
            >
              <Image
                src={projectImages[key]}
                alt={t(`${key}.title`)}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="translate-y-4 transform text-center transition-transform duration-300 group-hover:translate-y-0">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="h-px w-6 bg-[#c5a46c]" />
                    <span className="font-sans font-semibold text-[10px] tracking-[1.2px] text-[#c5a46c] uppercase">{t(`${key}.category`)}</span>
                    <span className="h-px w-6 bg-[#c5a46c]" />
                  </div>
                  <p className="font-serif italic text-2xl text-white">{t(`${key}.title`)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {selectedKey && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedKey(null)}
          >
            <motion.div
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={projectImages[selectedKey]}
                  alt={t(`${selectedKey}.title`)}
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-cover"
                  priority
                />
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-12">
                <span className="font-sans text-[10px] font-semibold tracking-[1.2px] text-[#c5a46c] uppercase">{t(`${selectedKey}.category`)}</span>
                <p className="font-serif italic text-2xl text-white">{t(`${selectedKey}.title`)}</p>
              </div>
              {/* Close button */}
              <button
                onClick={() => setSelectedKey(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label={t('close')}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
