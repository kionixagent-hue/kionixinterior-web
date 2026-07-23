const reviews = [
  {
    stars: 5,
    quote: '"Sangat puas dengan hasil pengerjaannya. Desain sesuai konsep yang kami inginkan, finishing rapi, pemasangan cepat, dan kualitas material sangat baik. Komunikasi selama proyek juga lancar sehingga semuanya berjalan tanpa kendala. Kios Lamoist sekarang tampil lebih premium dan menarik perhatian pelanggan. Highly recommended!"',
    name: 'Lamoist',
    role: 'Pemilik Kios, Batam',
  },
  {
    stars: 5,
    quote: '"Lemari custom yang dibuat pas dengan ruang kamar saya. Hasil akhir sangat memuaskan, harga kompetitif."',
    name: 'Ibu Sari Dewi',
    role: 'Penghuni Apartemen',
  },
  {
    stars: 5,
    quote: '"Interior kantor kami sekarang terlihat lebih profesional. Kionix bekerja tepat waktu sesuai perjanjian."',
    name: 'PT Maju Bersama',
    role: 'Pemilik Kantor, Batam',
  },
]

export default function Testimoni() {
  return (
    <section className="bg-bg-section px-5 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            TESTIMONI
          </span>
          <h2 className="font-serif text-5xl font-bold text-bg-dark">Apa Kata Klien Kami</h2>
          <div className="h-0.5 w-12 bg-accent" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map(({ quote, name, role }) => (
            <div key={name} className="flex flex-col gap-4 rounded-lg bg-white px-7 py-8 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.06)]">
              <span className="text-base text-accent">★★★★★</span>
              <p className="font-serif italic text-[17px] leading-[1.65] text-bg-dark">{quote}</p>
              <div className="h-px bg-border" />
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-semibold text-sm text-bg-dark">{name}</span>
                <span className="font-sans text-xs text-text-muted">{role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
