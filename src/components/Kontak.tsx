'use client'

import { WHATSAPP_URL } from '@/lib/constants'
import { trackWaClick } from '@/lib/trackWaClick'

const info = [
  { icon: '📍', text: 'Ruko Ciptaland Blok Lavender No.26, Batam' },
  { icon: '📱', text: '0813-7270-3589' },
  { icon: '🕐', text: 'Senin–Sabtu: 08.00–17.00 WIB' },
]

export default function Kontak() {
  return (
    <section id="kontak" className="bg-white px-5 py-24 md:px-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 md:flex-row md:items-start">
        {/* Info */}
        <div className="flex flex-col gap-6 md:w-[560px]">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            HUBUNGI KAMI
          </span>
          <h2 className="font-serif text-4xl font-bold leading-tight text-bg-dark">
            Mulai Proyek<br />Impian Anda
          </h2>
          <div className="h-0.5 w-12 bg-accent" />

          <div className="flex flex-col gap-4">
            {info.map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span className="text-base">{icon}</span>
                <span className="font-sans text-[15px] leading-relaxed text-bg-dark">{text}</span>
              </div>
            ))}
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWaClick('kontak')}
            className="inline-flex w-fit items-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-sm px-8 py-4 rounded transition-colors"
          >
            Mulai Proyek Anda →
          </a>
        </div>

        {/* Google Maps embed */}
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 md:h-[420px] md:w-[560px]">
          <iframe
            title="Lokasi Kionix Interior"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.2!2d103.9726001!3d1.1291379!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31d98ba9ad3034c3%3A0x85392866cf5c0ee1!2sKionix%20interior!5e0!3m2!1sid!2sid!4v1751000000000!5m2!1sid!2sid"
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  )
}
