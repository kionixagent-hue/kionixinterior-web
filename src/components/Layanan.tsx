import { UtensilsCrossed, Package2, Tv2, Home, Building2, Hotel } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Service {
  icon: LucideIcon
  title: string
  desc: string
  wide?: boolean
}

const services: Service[] = [
  {
    icon: UtensilsCrossed,
    title: 'Kitchen Set',
    desc: 'Desain dan instalasi kitchen set custom sesuai ukuran dapur Anda. Material premium, finishing rapi, fungsional dan estetik.',
  },
  {
    icon: Package2,
    title: 'Lemari Custom',
    desc: 'Lemari built-in dan wardrobe custom sesuai kebutuhan ruang dan selera Anda.',
  },
  {
    icon: Tv2,
    title: 'Backdrop TV',
    desc: 'Panel dinding TV yang elegan, menjadi focal point ruang tamu yang memukau.',
  },
  {
    icon: Hotel,
    title: 'Hotel & Apartemen',
    desc: 'Solusi interior lengkap untuk properti komersial — hotel, apartemen, villa, dan resort. Kami menghadirkan estetika yang selaras dengan identitas brand Anda.',
    wide: true,
  },
  {
    icon: Home,
    title: 'Renovasi Rumah',
    desc: 'Renovasi total atau parsial dengan konsep modern dan material berkualitas.',
  },
  {
    icon: Building2,
    title: 'Interior Kantor',
    desc: 'Workspace profesional yang meningkatkan produktivitas dan citra bisnis Anda.',
  },
]

function ServiceCard({ icon: Icon, title, desc, wide }: Service) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-border bg-white p-8 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.04)] ${
        wide ? 'col-span-full' : ''
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-text-on-dark">
        <Icon size={20} />
      </div>
      <h3 className="font-serif text-2xl font-bold text-bg-dark">{title}</h3>
      <p className="font-sans text-sm leading-relaxed text-text-muted">{desc}</p>
    </div>
  )
}

export default function Layanan() {
  return (
    <section id="layanan" className="bg-bg-section px-5 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-3">
          <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
            APA YANG KAMI TAWARKAN
          </span>
          <h2 className="font-serif text-5xl font-bold text-bg-dark">Layanan Kami</h2>
          <div className="h-0.5 w-12 bg-accent" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}
