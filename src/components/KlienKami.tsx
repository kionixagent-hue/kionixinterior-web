import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

// height fixed at 100px; width proportional to original aspect ratio
const clients = [
  { src: '/images/logo-hotel-89.png', alt: 'Hotel 89', width: 100, height: 100, href: 'https://89hotel.com/id-id/' },
  { src: '/images/logo-lamoist.png',  alt: 'Lamoist',  width: 203, height: 100, href: 'https://lamoist.com/' },
]

export default async function KlienKami() {
  const t = await getTranslations('klien')

  return (
    <section id="klien" className="bg-white px-5 py-20 md:px-20">
      <div className="mx-auto max-w-7xl flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-3">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-serif text-4xl font-bold text-gray-900">
            {t('title')}
          </h2>
          <div className="h-0.5 w-12 bg-accent" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-16">
          {clients.map(({ src, alt, width, height, href }) => (
            <a
              key={alt}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
            >
              <Image src={src} alt={alt} width={width} height={height} />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
