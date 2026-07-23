'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'

const projects = [
  { title: 'Kitchen Set',    category: 'DAPUR',        img: '/images/portfolio/kitchen-set.jpg' },
  { title: 'Kamar Tidur',   category: 'BEDROOM',       img: '/images/portfolio/bedroom.jpg' },
  { title: 'Ruang Tamu',    category: 'LIVING ROOM',   img: '/images/portfolio/living-room.jpg' },
  { title: 'Kantor Modern', category: 'OFFICE',        img: '/images/portfolio/office.jpg' },
  { title: 'Backdrop TV',   category: 'FEATURE WALL',  img: '/images/portfolio/backdrop-tv.jpg' },
  { title: 'Retail Booth',  category: 'RETAIL',        img: '/images/portfolio/retail-booth.jpg' },
  { title: 'Lemari Custom', category: 'STORAGE',       img: '/images/portfolio/lemari-custom.jpg' },
  { title: 'Apartemen',     category: 'RESIDENTIAL',   img: '/images/portfolio/apartment.jpg' },
  { title: 'Renovasi',      category: 'RENOVATION',    img: '/images/portfolio/project.jpg' },
]

type Project = (typeof projects)[number]

export default function Portfolio() {
  const [selected, setSelected] = useState<Project | null>(null)

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  return (
    <section id="portfolio" className="bg-white px-5 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            HASIL KARYA
          </span>
          <h2 className="font-serif text-5xl font-bold text-bg-dark">Hasil Karya Kami</h2>
          <div className="h-0.5 w-12 bg-accent" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <button
              key={p.title}
              onClick={() => setSelected(p)}
              className="relative h-64 overflow-hidden rounded-lg group text-left"
            >
              <Image
                src={p.img}
                alt={p.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="translate-y-4 transform text-center transition-transform duration-300 group-hover:translate-y-0">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="h-px w-6 bg-[#c5a46c]" />
                    <span className="font-sans font-semibold text-[10px] tracking-[1.2px] text-[#c5a46c] uppercase">{p.category}</span>
                    <span className="h-px w-6 bg-[#c5a46c]" />
                  </div>
                  <p className="font-serif italic text-2xl text-white">{p.title}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
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
                  src={selected.img}
                  alt={selected.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-cover"
                  priority
                />
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-12">
                <span className="font-sans text-[10px] font-semibold tracking-[1.2px] text-[#c5a46c] uppercase">{selected.category}</span>
                <p className="font-serif italic text-2xl text-white">{selected.title}</p>
              </div>
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Tutup"
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
