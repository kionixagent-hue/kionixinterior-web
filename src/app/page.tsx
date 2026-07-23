import Hero from '@/components/Hero'
import Layanan from '@/components/Layanan'
import Portfolio from '@/components/Portfolio'
import TentangKami from '@/components/TentangKami'
import KlienKami from '@/components/KlienKami'
import Testimoni from '@/components/Testimoni'
import Kontak from '@/components/Kontak'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <Layanan />
      <Portfolio />
      <TentangKami />
      <KlienKami />
      <Testimoni />
      <Kontak />
      <Footer />
    </main>
  )
}
