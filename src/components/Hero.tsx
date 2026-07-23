'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { WHATSAPP_URL } from '@/lib/constants'

const slides = [
  '/images/portfolio/kitchen-set.jpg',
  '/images/portfolio/bedroom.jpg',
  '/images/portfolio/living-room.jpg',
  '/images/portfolio/office.jpg',
  '/images/portfolio/backdrop-tv.jpg',
  '/images/portfolio/retail-booth.jpg',
  '/images/portfolio/lemari-custom.jpg',
  '/images/portfolio/apartment.jpg',
]

export default function Hero() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative flex min-h-screen overflow-hidden pt-16" aria-label="Hero">
      {/* Slideshow background */}
      <AnimatePresence>
        <motion.div
          key={idx}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <Image
            src={slides[idx]}
            alt="Kionix Interior Project"
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay: dark left, fade right */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/85 to-bg-dark/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col justify-center px-8 py-20 md:w-3/5 md:px-20">
        <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
          JASA INTERIOR BATAM
        </span>

        <div className="mt-6 h-0.5 w-12 bg-accent" />

        <h1 className="mt-4 font-serif font-bold leading-[0.95] tracking-wide text-text-on-dark text-6xl md:text-8xl">
          KIONIX<br />INTERIOR
        </h1>

        <p className="mt-8 font-serif italic font-medium text-2xl md:text-3xl text-text-on-dark">
          Wujudkan Ruang Impian Anda
        </p>

        <p className="mt-5 font-sans text-base leading-relaxed text-text-muted max-w-lg">
          Spesialis interior rumah, kantor, apartemen &amp; hotel di Batam
        </p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-12 inline-flex w-fit items-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-sm px-8 py-4 rounded transition-colors"
        >
          Konsultasi Gratis via WhatsApp →
        </a>

        <a
          href="#layanan"
          className="mt-4 font-sans text-xs tracking-widest text-text-muted hover:text-accent transition-colors"
        >
          ↓ Lihat Layanan Kami
        </a>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-8 z-10 flex gap-1.5 md:left-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-0.5 transition-all duration-300 ${i === idx ? 'w-8 bg-accent' : 'w-3 bg-white/40'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
