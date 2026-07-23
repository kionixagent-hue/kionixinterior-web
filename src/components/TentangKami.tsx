'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const slides = [
  { src: '/workshop1.jpg', alt: 'Workshop Kionix 1' },
  { src: '/workshop2.jpg', alt: 'Workshop Kionix 2' },
  { src: '/workshop3.jpg', alt: 'Workshop Kionix 3' },
  { src: '/workshop4.jpg', alt: 'Workshop Kionix 4' },
]

// clone pertama di akhir untuk loop mulus
const loop = [...slides, slides[0]]

export default function TentangKami() {
  const t = useTranslations('tentang')
  const [current, setCurrent] = useState(0)
  const [animated, setAnimated] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => c + 1), 3500)
    return () => clearInterval(timer)
  }, [])

  // Saat sampai di clone (index 4), silent jump ke index 0
  useEffect(() => {
    if (current === slides.length) {
      const t2 = setTimeout(() => {
        setAnimated(false)
        setCurrent(0)
      }, 700)
      return () => clearTimeout(t2)
    }
    if (!animated) {
      const t2 = setTimeout(() => setAnimated(true), 50)
      return () => clearTimeout(t2)
    }
  }, [current, animated])

  const activeDot = current % slides.length
  const stats = [
    { value: '50+', label: t('statProjects') },
    { value: '100%', label: t('statClients') },
    { value: 'Batam', label: t('statArea') },
  ]

  return (
    <section id="tentang" className="bg-bg-dark px-5 py-24 md:px-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 md:flex-row md:items-center">
        {/* Slideshow */}
        <div className="relative h-80 w-full shrink-0 overflow-hidden rounded-lg md:h-[420px] md:w-[540px]">
          {loop.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                transform: `translateX(${(i - current) * 100}%)`,
                transition: animated ? 'transform 700ms ease-in-out' : 'none',
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 540px"
                priority={i === 0}
              />
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimated(true); setCurrent(i) }}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeDot ? 'w-6 bg-accent' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-serif text-4xl font-bold text-text-on-dark">
            {t('title')}
          </h2>
          <div className="h-0.5 w-12 bg-accent" />
          <p className="font-sans text-[15px] leading-[1.75] text-text-muted max-w-xl">
            {t('desc')}
          </p>

          <div className="flex gap-12">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="font-serif text-4xl font-bold text-accent">{value}</span>
                <span className="font-sans font-medium text-[13px] text-text-on-dark">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
