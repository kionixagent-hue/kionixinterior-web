import { getTranslations } from 'next-intl/server'

const reviewKeys = ['lamoist', 'sariDewi', 'majuBersama'] as const
const reviewNames: Record<(typeof reviewKeys)[number], string> = {
  lamoist: 'Lamoist',
  sariDewi: 'Ibu Sari Dewi',
  majuBersama: 'PT Maju Bersama',
}

export default async function Testimoni() {
  const t = await getTranslations('testimoni')

  return (
    <section className="bg-bg-section px-5 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-serif text-5xl font-bold text-bg-dark">{t('title')}</h2>
          <div className="h-0.5 w-12 bg-accent" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviewKeys.map((key) => (
            <div key={key} className="flex flex-col gap-4 rounded-lg bg-white px-7 py-8 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.06)]">
              <span className="text-base text-accent">★★★★★</span>
              <p className="font-serif italic text-[17px] leading-[1.65] text-bg-dark">{t(`${key}.quote`)}</p>
              <div className="h-px bg-border" />
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-semibold text-sm text-bg-dark">{reviewNames[key]}</span>
                <span className="font-sans text-xs text-text-muted">{t(`${key}.role`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
