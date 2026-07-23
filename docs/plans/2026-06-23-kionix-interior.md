# Kionix Interior — Company Profile Website

## Project Brief

| Info | Detail |
|---|---|
| **Bisnis** | Kionix Interior — jasa interior rumah, kantor, apartemen, hotel |
| **Layanan** | Kitchen set, lemari custom, backdrop TV, renovasi |
| **Lokasi** | Ruko Ciptaland Blok Lavender No.26, Batam |
| **WhatsApp** | +6281372703589 |
| **Target** | Homeowner + B2B (seimbang) |
| **Tagline** | "Wujudkan Ruang Impian Anda" |
| **Stack** | Next.js + Tailwind CSS |
| **Bahasa** | Bahasa Indonesia |
| **Logo** | Tersedia |
| **Foto** | Placeholder dulu |
| **Approach** | One-Page Company Profile + smooth scroll |

---

## Design

### Aesthetic Direction

**Style: Indonesian Modern Prestige**

Interior brand yang terlihat kelas dunia namun tetap hangat dan approachable untuk klien lokal Batam. Mengambil inspirasi dari studio interior premium Asia Tenggara (Singapore, KL, Jakarta). Serif editorial heading dikontraskan dengan geometric sans body, di atas off-white warm surface dengan aksen charcoal-navy dan brass/gold.

### Color Palette

> **Source of Truth:** Figma file `vWA2zGbpXuk8xXc6Suqqoq` — semua token sudah di-set sebagai Figma Color Variables dan tersinkron dengan logo brand `#26A1B0`.

| Token | Hex | Penggunaan |
|---|---|---|
| `bg-base` | `#FAFAFA` | Background halaman |
| `bg-section` | `#EFF7F8` | Section alternating (teal tint tipis) |
| `bg-dark` | `#0C1A1D` | Hero overlay, footer, dark section |
| `accent` | `#26A1B0` | CTA button, garis, highlight — warna logo |
| `accent-hover` | `#1D8898` | Hover state accent |
| `text-primary` | `#0C1A1D` | Teks utama |
| `text-muted` | `#607A80` | Subtitle, caption, label sekunder |
| `text-on-dark` | `#FFFFFF` | Teks di atas background gelap |
| `border` | `#C8E4E8` | Divider, card border |
| `wa-green` | `#25D366` | Floating WhatsApp button |
| `wa-hover` | `#1DA851` | WhatsApp hover |

### Typography

Source: `data/typography.csv` Row 32 (Real Estate Luxury) — "interior design" listed as explicit best use case.

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / H1 | Cormorant Garamond | 600–700 | Hero headline, tagline |
| Heading H2–H3 | Cormorant Garamond | 500 | Section titles |
| Body / UI | Plus Jakarta Sans | 400–600 | Paragraf, deskripsi |
| Label / Nav | Plus Jakarta Sans | 600 uppercase + letter-spacing | Nav items, service labels |
| CTA Button | Plus Jakarta Sans | 700 | Button text |

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

### Layout Blueprint

One-page dengan 7 sections + floating element:

```
1. NAVBAR      — sticky, backdrop-blur on scroll, logo + nav + WA button
2. HERO        — split diagonal 60/40, bg-dark left + image right
3. LAYANAN     — bento grid asymmetric (bukan 3-col simetris)
4. PORTFOLIO   — masonry grid varying heights (placeholder)
5. TENTANG KAMI— dark section split, story + stat numbers
6. TESTIMONI   — horizontal scroll cards (placeholder)
7. KONTAK      — split 60/40, contact info + Google Maps embed
8. FOOTER      — dark, minimal
   + FLOATING WA BUTTON (always visible, bottom-right)
```

### Sections Content

**Hero:**
- H1: `KIONIX INTERIOR` (Cormorant Garamond 700, large tracking)
- H2: `Wujudkan Ruang Impian Anda` (italic variant, medium weight)
- Subtitle: `Spesialis interior rumah, kantor, apartemen & hotel di Batam`
- CTA: `[Konsultasi Gratis via WhatsApp →]` (brass/gold button)

**Layanan (6 cards, bento grid):**
- Kitchen Set (featured/large)
- Lemari Custom
- Backdrop TV
- Renovasi Rumah
- Interior Kantor
- Hotel & Apartemen

**Tentang Kami stats:**
- `50+ Proyek Selesai`
- `100% Klien Puas`
- `Batam & Sekitarnya`

**Kontak:**
- Alamat: Ruko Ciptaland Blok Lavender No.26, Batam
- WhatsApp: 0813-7270-3589
- CTA: `Mulai Proyek Anda →`

### Motion Plan

| Elemen | Animasi | Durasi | Easing |
|---|---|---|---|
| Navbar scroll | backdrop-blur + bg-opacity fade | 200ms | ease-out |
| Hero text | fade-up stagger on load | 600ms | cubic-bezier(0.16,1,0.3,1) |
| Service cards | scale 1.02 + shadow on hover | 200ms | ease-out |
| Portfolio tiles | opacity + translateY(8px) scroll reveal | 400ms | ease-out |
| Floating WA | scale 1.1 pulse every 3s | 300ms | ease-in-out |
| CTA button | background slide fill left→right | 250ms | ease-out |

### Anti-AI-Slop Self-Check

- [x] No Inter/Roboto/Arial as primary (Cormorant Garamond + Plus Jakarta Sans)
- [x] No purple gradient on white (brass/gold accent)
- [x] Layout asymmetric (diagonal hero, bento grid, masonry portfolio)
- [x] Shadows used intentionally (card hover only)
- [x] Icons from single library (Lucide React)
- [x] Animation durations 150-600ms (within range)
- [x] Backgrounds layered (off-white + warm sand alternating)
- [x] Microcopy specific ("Konsultasi Gratis via WhatsApp →", "Mulai Proyek Anda →")
- [x] CTA hierarchy clear (primary brass/gold, secondary ghost)

### Accessibility

- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section aria-label>`, `<footer>`
- Contrast: `#1C2B3A` on `#FAFAF9` → ~12:1 ratio (WCAG AAA)
- Keyboard: Tab order natural, all interactive elements focusable
- ARIA: `aria-label` on WA button, nav, images
- Alt text: semua gambar/placeholder

### Data Integration Map

| Component | Data Source | Tersedia? | Notes |
|---|---|---|---|
| Logo | File dari klien | Ya | Format: SVG/PNG |
| Foto Portfolio | Foto proyek | Belum | Placeholder dulu |
| WhatsApp Link | +6281372703589 | Ya | `https://wa.me/6281372703589` |
| Google Maps | Embed Ruko Ciptaland Batam | Ya | iframe embed |
| Testimoni | Dari klien | Placeholder | 3 placeholder cards |
| Animasi Scroll | Framer Motion / CSS | N/A | Built-in |

---

<!-- gaspol-plan akan APPEND ## Implementation Plan section di sini -->

---

## Figma Design Reference

| Item | Detail |
|---|---|
| **File Key** | `vWA2zGbpXuk8xXc6Suqqoq` |
| **MCP Tool** | `mcp__figma__get_design_context` / `get_screenshot` |
| **Logo PNG** | `d:\kionix\LOGO KIONIX.png` — imageHash `b32293418cc7a2835513f22003694f10807fbd16` |
| **Color Variables** | Sudah di-set di Figma, gunakan tabel di atas |

**Node IDs penting:**
- `3:4` pageWrapper, `3:5` Navbar, `4:2` Hero
- `5:2` Layanan, `6:2` Portfolio, `7:2` Tentang
- `7:23` Testimoni, `7:50` Kontak, `7:69` Footer, `7:81` FloatingWA

Sebelum implementasi setiap section, jalankan `get_design_context` pada node ID yang relevan untuk ambil layout/token yang akurat.

---

> **For Claude:** REQUIRED SKILL: Use `gaspol-execute` to implement this plan.
> **CRITICAL:** This plan specifies real integrations. NEVER substitute placeholders
> for real data sources without explicit user approval. If a data source doesn't
> exist yet, STOP and ask.

## Implementation Plan

### Goal

Membangun website company profile satu-halaman untuk Kionix Interior — perusahaan jasa interior di Batam — menggunakan Next.js 14 App Router + Tailwind CSS + Framer Motion + Lucide React. Website menampilkan 7 section dengan smooth scroll, floating WhatsApp CTA, dan siap deploy ke Vercel.

### Tech Stack

| Layer | Library | Versi |
|---|---|---|
| Framework | Next.js | 14 (App Router) |
| Styling | Tailwind CSS | 3.x |
| Animation | Framer Motion | latest |
| Icons | Lucide React | latest |
| Fonts | Google Fonts via `next/font` | — |
| Testing | Jest + React Testing Library | latest |
| Deploy | Vercel | free tier |

### Data Integration Map

| Feature | Data Source | Component | Exists? | Action |
|---|---|---|---|---|
| Logo | `/public/logo.*` dari klien | Navbar, Hero, Footer | Butuh file | Client upload — gunakan teks fallback dulu |
| WhatsApp Number | Konstanta `+6281372703589` | FloatingWA, Hero, Kontak | Yes | `src/lib/constants.ts` |
| WhatsApp URL | `https://wa.me/6281372703589` | FloatingWA, Hero, Kontak | Yes | Generate dari konstanta |
| Google Maps | Embed URL Ruko Ciptaland Batam | KontakSection | Ya (public) | iframe embed statik |
| Foto Portfolio | `/public/images/portfolio/` | PortfolioSection | Belum ada | Placeholder gradient tiles |
| Layanan data | Static array (6 items) | LayananSection | Hardcoded | `src/data/layanan.ts` |
| Testimoni data | Static array (3 items) | TestimoniSection | Placeholder | `src/data/testimoni.ts` |
| Portfolio data | Static array (9 items) | PortfolioSection | Placeholder | `src/data/portfolio.ts` |
| Stats (Tentang) | Hardcoded (50+, 100%, Batam) | TentangSection | Hardcoded | Inline dalam komponen |
| OG Image | `/public/og-image.jpg` | `layout.tsx` metadata | Belum ada | Placeholder, bisa diisi nanti |

---

### Phase 0: Project Bootstrap + Docker Dev Environment

**Estimated time:** 15 menit

**Files:**
- Create: `d:\kionix\` (root project via `create-next-app`)
- Modify: `tailwind.config.ts`
- Create: `jest.config.ts`, `jest.setup.ts`
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`

**Steps:**
1. Write failing test: file `src/__tests__/smoke.test.ts` dengan `expect(true).toBe(false)`. Expected error: `Expected: false, Received: true`
2. Run `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git` di `d:\kionix`
3. Install deps: `npm install framer-motion lucide-react`
4. Install test deps: `npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest`
5. Buat `jest.config.ts` dan `jest.setup.ts`
6. Fix smoke test menjadi `expect(true).toBe(true)`, run `npm test`, confirm pass
7. Buat `Dockerfile` (multi-stage):
   ```dockerfile
   FROM node:20-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci

   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/public ./public
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```
8. Buat `docker-compose.yml` untuk dev:
   ```yaml
   services:
     web:
       build: .
       ports:
         - "3000:3000"
       volumes:
         - .:/app
         - /app/node_modules
         - /app/.next
       environment:
         - NODE_ENV=development
       command: npm run dev
   ```
9. Buat `.dockerignore`: `node_modules\n.next\n.git\n*.log`
10. Test Docker: `docker compose up` — verify `localhost:3000` accessible
11. Commit: `feat: bootstrap Next.js 14 + Tailwind + Framer Motion + Docker`

**Verification:**
- [ ] `npm run dev` starts di `localhost:3000` tanpa error
- [ ] `npm run build` clean output
- [ ] `npm test` passes (smoke test)
- [ ] `tsc --noEmit` zero errors
- [ ] `docker compose up` — app accessible di `localhost:3000`
- [ ] Docker Desktop menampilkan container `kionix-web` running

---

### Phase 1: Design System Tokens + Constants

**Estimated time:** 10 menit

**Files:**
- Create: `src/lib/constants.ts`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Test: `src/__tests__/constants.test.ts`

**Steps:**
1. Write failing test: import `WHATSAPP_URL` dari `@/lib/constants`, expect `toBe('https://wa.me/6281372703589')`. Expected error: `Cannot find module '@/lib/constants'`
2. Run test, confirm failure
3. Create `src/lib/constants.ts`:
   ```ts
   export const WHATSAPP_NUMBER = '6281372703589'
   export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
   export const COMPANY_NAME = 'Kionix Interior'
   export const TAGLINE = 'Wujudkan Ruang Impian Anda'
   export const ADDRESS = 'Ruko Ciptaland Blok Lavender No.26, Batam'
   export const MAPS_EMBED_URL = 'https://maps.google.com/maps?q=Ruko+Ciptaland+Blok+Lavender+Batam&output=embed'
   ```
4. Configure `tailwind.config.ts` — tambah `extend.colors`:
   ```js
   'bg-base': '#FAFAFA',
   'bg-section': '#EFF7F8',
   'bg-dark': '#0C1A1D',
   'accent': '#26A1B0',
   'accent-hover': '#1D8898',
   'text-kionix': '#0C1A1D',
   'text-muted': '#607A80',
   'text-on-dark': '#FFFFFF',
   'border-kionix': '#C8E4E8',
   'wa-green': '#25D366',
   ```
5. Configure `tailwind.config.ts` — tambah `extend.fontFamily`:
   ```js
   serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
   sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
   ```
6. Update `src/app/layout.tsx`: import `Cormorant_Garamond` + `Plus_Jakarta_Sans` via `next/font/google`, apply CSS variables ke `<html>`, set `metadata` (title: `Kionix Interior — Batam`, description: `Spesialis interior rumah, kantor, apartemen & hotel di Batam`)
7. Run tests, confirm pass
8. Commit: `feat: design tokens, constants, fonts`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Constants test passes
- [ ] Tailwind class `bg-bg-dark` resolves (verify via dev tools)
- [ ] Cormorant Garamond + Plus Jakarta Sans load di browser
- [ ] `<title>` benar di browser tab

---

### Phase 2: Navbar Component

**Estimated time:** 15 menit

**Files:**
- Create: `src/components/Navbar.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/__tests__/Navbar.test.tsx`

**Steps:**
1. Write failing test: render `<Navbar />`, expect link dengan `href` mengandung `wa.me/6281372703589`. Expected error: `Cannot find module '@/components/Navbar'`
2. Run test, confirm failure
3. Implement `src/components/Navbar.tsx`:
   - `'use client'` (butuh `useEffect` untuk scroll listener)
   - State: `isScrolled` (boolean, aktif setelah 50px)
   - `className`: `fixed top-0 w-full z-50 transition-all duration-200`, tambah `backdrop-blur-md bg-bg-base/90 shadow-sm` ketika `isScrolled`
   - Logo: teks `KIONIX INTERIOR` (font-serif) + tagline kecil, sampai logo tersedia
   - Nav links (hidden mobile, flex desktop): `#layanan`, `#portfolio`, `#tentang`, `#kontak` — smooth scroll via `scroll-smooth` di `<html>`
   - Mobile: hamburger toggle (Lucide `Menu` / `X` icon), drawer sederhana
   - WA button (desktop): `bg-accent text-white`, links ke `WHATSAPP_URL`
4. Add `scroll-smooth` ke `<html>` di `layout.tsx`
5. Import `<Navbar />` di `layout.tsx` di atas `{children}`
6. Run tests, confirm pass
7. Commit: `feat: sticky Navbar with scroll blur + mobile menu`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes
- [ ] Navbar sticks saat scroll (tested browser)
- [ ] Blur + shadow muncul setelah 50px scroll
- [ ] Mobile hamburger menu buka/tutup
- [ ] Smooth scroll ke section saat klik nav link

---

### Phase 3: Hero Section

**Estimated time:** 20 menit

**Files:**
- Create: `src/components/HeroSection.tsx`
- Create: `public/images/hero-placeholder.svg` (inline SVG pattern)
- Modify: `src/app/page.tsx`
- Test: `src/__tests__/HeroSection.test.tsx`

**Steps:**
1. Write failing test: render `<HeroSection />`, expect heading text `KIONIX INTERIOR` dan link `Konsultasi Gratis`. Expected error: `Cannot find module '@/components/HeroSection'`
2. Run test, confirm failure
3. Implement `src/components/HeroSection.tsx`:
   - `'use client'` (Framer Motion)
   - Layout: `<section>` dengan `min-h-screen grid grid-cols-1 lg:grid-cols-[60%_40%]`
   - Left panel: `bg-bg-dark` dengan padding, teks `text-text-on-dark`
   - Diagonal divider desktop: `clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%)` pada left panel (atau right panel inverse)
   - H1: `KIONIX INTERIOR` (font-serif text-5xl lg:text-7xl font-bold tracking-tight)
   - Garis emas: `<div className="w-16 h-0.5 bg-accent my-4" />`
   - Tagline: `Wujudkan Ruang Impian Anda` (font-serif italic text-2xl)
   - Subtitle: `Spesialis interior rumah, kantor, apartemen & hotel di Batam`
   - CTA button: `href={WHATSAPP_URL}` target `_blank`, `bg-accent hover:bg-accent-hover text-white font-sans font-bold`
   - CTA teks: `Konsultasi Gratis via WhatsApp →`
   - Scroll indicator: `↓ Lihat Layanan Kami` dengan animate bounce
   - Right panel: placeholder gradient `bg-gradient-to-br from-bg-dark/50 to-bg-dark` dengan SVG pattern overlay
   - Framer Motion: `fadeUp` variant, stagger 0.15s pada H1, garis, tagline, subtitle, CTA
4. Add mobile: left panel full width, right panel hidden on mobile
5. Import `<HeroSection id="hero" />` di `page.tsx`
6. Run tests, confirm pass
7. Commit: `feat: Hero section diagonal split + fade animation`

**Design Deliverable:**
- Tokens: bg-dark `#1C2B3A`, accent `#C5A46C`, text-on-dark `#F5F3EF`
- Layout: 60/40 grid dengan clip-path diagonal
- Motion: fadeUp stagger 150ms delay each, 600ms duration, cubic-bezier(0.16,1,0.3,1)
- Mobile: stacked, image hidden, full-width text panel

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes
- [ ] Split layout tampil di desktop (lg:)
- [ ] Mobile: single column, text full width
- [ ] CTA button → WA URL correct
- [ ] Fade-up animation plays on first load (no layout shift)

---

### Phase 4: Layanan Section

**Estimated time:** 15 menit

**Files:**
- Create: `src/data/layanan.ts`
- Create: `src/components/LayananSection.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/__tests__/LayananSection.test.tsx`

**Steps:**
1. Write failing test: render `<LayananSection />`, expect 6 items dari data layanan. Expected error: `Cannot find module '@/components/LayananSection'`
2. Run test, confirm failure
3. Create `src/data/layanan.ts`:
   ```ts
   export const layananData = [
     { id: 1, title: 'Kitchen Set', desc: '...', icon: 'ChefHat', size: 'large' },
     { id: 2, title: 'Lemari Custom', desc: '...', icon: 'Package', size: 'medium' },
     { id: 3, title: 'Backdrop TV', desc: '...', icon: 'Monitor', size: 'small' },
     { id: 4, title: 'Renovasi Rumah', desc: '...', icon: 'Home', size: 'medium' },
     { id: 5, title: 'Interior Kantor', desc: '...', icon: 'Building2', size: 'small' },
     { id: 6, title: 'Hotel & Apartemen', desc: '...', icon: 'Hotel', size: 'small' },
   ]
   ```
4. Implement `LayananSection.tsx`:
   - Background: `bg-bg-section`
   - Section heading: `Layanan Kami` (Cormorant Garamond) + garis aksen
   - Grid: `grid grid-cols-2 lg:grid-cols-3 gap-4` dengan override untuk `size: 'large'` → `col-span-2 row-span-2`
   - Setiap card: `bg-bg-base border border-border-kionix rounded-lg p-6 hover:scale-[1.02] transition-transform duration-200`
   - Lucide icon, title (font-serif), description (font-sans text-sm text-text-muted)
   - Scroll-reveal: Framer Motion `whileInView` fadeUp
5. Run tests, confirm pass
6. Commit: `feat: Layanan section bento grid`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes (6 cards render)
- [ ] Kitchen Set card = col-span-2 pada desktop
- [ ] Hover scale animation 200ms
- [ ] Lucide icons render (single library, tidak ada emoji)
- [ ] Mobile: 2-column grid

---

### Phase 5: Portfolio Section

**Estimated time:** 15 menit

**Files:**
- Create: `src/data/portfolio.ts`
- Create: `src/components/PortfolioSection.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/__tests__/PortfolioSection.test.tsx`

**Steps:**
1. Write failing test: render `<PortfolioSection />`, expect heading `Hasil Karya Kami`. Expected error: `Cannot find module '@/components/PortfolioSection'`
2. Run test, confirm failure
3. Create `src/data/portfolio.ts`: 9 placeholder items dengan `{ id, title, category, aspect: 'tall'|'wide'|'square', bgColor: string }`
4. Implement `PortfolioSection.tsx`:
   - Background: `bg-bg-base`
   - Heading: `Hasil Karya Kami`
   - Masonry: CSS columns (`columns-1 sm:columns-2 lg:columns-3 gap-4`)
   - Setiap tile: `break-inside-avoid mb-4 rounded-lg overflow-hidden relative group`
   - Placeholder: `bg-gradient-to-br` dengan warna dari data, tinggi bervariasi (`aspect-[4/3]`, `aspect-[3/4]`, `aspect-square`)
   - Overlay: category label + project title muncul saat hover (`opacity-0 group-hover:opacity-100 transition-opacity`)
   - CTA: `Lihat Semua Hasil Karya` → `#` (placeholder untuk halaman portfolio nanti)
   - Scroll-reveal: staggered fadeUp via Framer Motion
5. Run tests, confirm pass
6. Commit: `feat: Portfolio masonry placeholder grid`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes
- [ ] 9 tiles render dengan varying heights
- [ ] Hover overlay tampil
- [ ] Responsive: 1→2→3 columns
- [ ] Tidak ada horizontal overflow

---

### Phase 6: Tentang Kami Section

**Estimated time:** 12 menit

**Files:**
- Create: `src/components/TentangSection.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/__tests__/TentangSection.test.tsx`

**Steps:**
1. Write failing test: render `<TentangSection />`, expect teks `50+` dan `Kionix Interior`. Expected error: `Cannot find module '@/components/TentangSection'`
2. Run test, confirm failure
3. Implement `TentangSection.tsx`:
   - Background: `bg-bg-dark`
   - Layout: `grid grid-cols-1 lg:grid-cols-2 gap-12`
   - Left: placeholder visual (`bg-bg-dark/50 border border-border-kionix/30 rounded-lg`) dengan logo overlay + pattern
   - Right: heading `Tentang Kionix Interior` (font-serif text-text-on-dark), paragraf cerita perusahaan (baru mulai, fokus kualitas & harga kompetitif), 3 stat items
   - Stats: `<div className="grid grid-cols-3">` dengan angka besar (Cormorant Garamond 700 text-accent) + label (Plus Jakarta Sans)
   - Stats data: `['50+', '100%', 'Batam']` dengan label `['Proyek Selesai', 'Klien Puas', 'Area Layanan']`
   - Scroll-reveal pada stats: Framer Motion `whileInView` dengan stagger
4. Run tests, confirm pass
5. Commit: `feat: Tentang Kami dark section`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes
- [ ] Dark background `#1C2B3A` renders
- [ ] 3 stats display dengan angka + label
- [ ] Split layout stacks on mobile
- [ ] Teks on-dark readable (contrast check)

---

### Phase 7: Testimoni Section

**Estimated time:** 12 menit

**Files:**
- Create: `src/data/testimoni.ts`
- Create: `src/components/TestimoniSection.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/__tests__/TestimoniSection.test.tsx`

**Steps:**
1. Write failing test: render `<TestimoniSection />`, expect 3 cards dengan bintang (Star icon). Expected error: `Cannot find module '@/components/TestimoniSection'`
2. Run test, confirm failure
3. Create `src/data/testimoni.ts`:
   ```ts
   export const testimoniData = [
     { id: 1, name: 'Budi Santoso', role: 'Pemilik Rumah, Batam', content: 'Kitchen set yang dikerjakan Kionix sangat rapi dan sesuai ukuran. Tim sangat profesional!', rating: 5 },
     { id: 2, name: 'Ibu Sari Dewi', role: 'Penghuni Apartemen', content: 'Lemari custom yang dibuat pas dengan ruang kamar saya. Hasil akhir sangat memuaskan.', rating: 5 },
     { id: 3, name: 'PT Maju Bersama', role: 'Pemilik Kantor, Batam', content: 'Interior kantor kami sekarang terlihat lebih profesional. Kionix bekerja tepat waktu.', rating: 5 },
   ]
   ```
4. Implement `TestimoniSection.tsx`:
   - Background: `bg-bg-section`
   - Heading: `Apa Kata Klien Kami`
   - Container: `flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory` (horizontal scroll)
   - Setiap card: `flex-shrink-0 w-80 snap-start bg-bg-base border border-border-kionix rounded-xl p-6`
   - 5 Lucide `Star` icons berwarna `text-accent` (fill current)
   - Quote text, nama, role
   - Hide scrollbar via `scrollbar-hide` (tambah ke Tailwind via plugin atau CSS)
5. Run tests, confirm pass
6. Commit: `feat: Testimoni horizontal scroll`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes
- [ ] 3 cards render
- [ ] Horizontal scroll bekerja di mobile (swipe)
- [ ] Star icons muncul (Lucide, bukan emoji)
- [ ] Snap scroll: satu card per snap

---

### Phase 8: Kontak Section + Google Maps

**Estimated time:** 15 menit

**Files:**
- Create: `src/components/KontakSection.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/__tests__/KontakSection.test.tsx`

**Steps:**
1. Write failing test: render `<KontakSection />`, expect teks `Ciptaland` dan link dengan `wa.me`. Expected error: `Cannot find module '@/components/KontakSection'`
2. Run test, confirm failure
3. Implement `KontakSection.tsx`:
   - Background: `bg-bg-base`
   - Layout: `grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8`
   - Left panel:
     - Heading: `Hubungi Kami` (font-serif)
     - Address: Lucide `MapPin` + `ADDRESS` dari constants
     - Phone: Lucide `Phone` + `0813-7270-3589`
     - CTA button: `href={WHATSAPP_URL + '?text=Halo Kionix, saya ingin konsultasi'}` → `Mulai Proyek Anda →`
     - Note jam operasional: `Senin–Sabtu: 08.00–17.00 WIB`
   - Right panel:
     - `<iframe>` Google Maps embed `MAPS_EMBED_URL`, `width="100%" height="350"`, `loading="lazy"`, `allowFullScreen`, `referrerPolicy="no-referrer-when-downgrade"`, `title="Lokasi Kionix Interior Batam"`
     - Border radius: `rounded-xl overflow-hidden`
4. Run tests, confirm pass
5. Commit: `feat: Kontak section + Google Maps embed`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes
- [ ] Address teks benar
- [ ] WA link dengan pre-filled message bekerja
- [ ] Maps iframe loads (tested browser)
- [ ] Responsive: stacks on mobile

---

### Phase 9: Footer + Floating WhatsApp

**Estimated time:** 12 menit

**Files:**
- Create: `src/components/Footer.tsx`
- Create: `src/components/FloatingWA.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/__tests__/Footer.test.tsx`
- Test: `src/__tests__/FloatingWA.test.tsx`

**Steps:**
1. Write failing test: `<Footer />` renders copyright text mengandung `Kionix Interior`; `<FloatingWA />` renders link ke `wa.me`. Expected error: `Cannot find module '@/components/Footer'`
2. Run test, confirm failure
3. Implement `Footer.tsx`:
   - `bg-bg-dark text-text-on-dark`
   - `KIONIX INTERIOR` (font-serif large) + alamat singkat
   - Nav links: `#layanan #portfolio #tentang #kontak` (inline horizontal)
   - Copyright: `© ${new Date().getFullYear()} Kionix Interior. Batam.`
4. Implement `FloatingWA.tsx`:
   - `'use client'`
   - `fixed bottom-6 right-6 z-50`
   - Link `href={WHATSAPP_URL}` target `_blank`
   - Button: `bg-wa-green hover:bg-green-600 text-white rounded-full p-4 shadow-lg`
   - Icon: Lucide `MessageCircle` size 28
   - Tooltip: `Chat Sekarang` muncul saat hover (absolute positioned)
   - Pulse: Framer Motion `animate={{ scale: [1, 1.1, 1] }}` repeat setiap 3s
5. Import `<Footer />` dan `<FloatingWA />` di `layout.tsx` setelah `{children}`
6. Run tests, confirm pass
7. Commit: `feat: Footer + FloatingWA button`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes
- [ ] Footer tampil di bawah semua section
- [ ] FloatingWA button visible di semua scroll position (z-50)
- [ ] Pulse animation berjalan
- [ ] Tooltip muncul saat hover
- [ ] WA link benar

---

### Phase 10: Page Assembly + SEO

**Estimated time:** 10 menit

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Create: `public/robots.txt`
- Test: `src/__tests__/page.test.tsx`

**Steps:**
1. Write failing test: render page, expect section IDs `hero`, `layanan`, `portfolio`, `tentang`, `testimoni`, `kontak`. Expected error: satu atau lebih section ID tidak ditemukan
2. Run test, confirm failure
3. Assemble `src/app/page.tsx` — import dan susun semua section dengan `id` yang benar:
   ```tsx
   <HeroSection id="hero" />
   <LayananSection id="layanan" />
   <PortfolioSection id="portfolio" />
   <TentangSection id="tentang" />
   <TestimoniSection id="testimoni" />
   <KontakSection id="kontak" />
   ```
4. Update metadata di `layout.tsx`:
   ```ts
   export const metadata: Metadata = {
     title: 'Kionix Interior — Spesialis Interior Batam',
     description: 'Jasa interior rumah, kantor, apartemen & hotel di Batam. Kitchen set, lemari custom, backdrop TV. Hubungi kami via WhatsApp.',
     openGraph: { title: '...', description: '...', images: ['/og-image.jpg'] },
   }
   ```
5. Buat `public/robots.txt`: `User-agent: * \n Allow: /`
6. Run tests, confirm pass
7. Commit: `feat: page assembly + SEO metadata`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Test passes (semua 6 section IDs ada)
- [ ] Smooth scroll dari navbar ke setiap section bekerja
- [ ] `<title>` benar di browser tab
- [ ] Meta description benar (view source)
- [ ] Tidak ada hydration error di console

---

### Phase 11: Responsive Polish + Accessibility

**Estimated time:** 15 menit

**Files:**
- Modify: semua component files (responsive tweaks)

**Steps:**
1. Write failing test: confirm semua section headings punya `aria-label` atau `id`. Expected error: missing attributes
2. Buka browser DevTools → Toggle device toolbar → test di 320px, 768px, 1024px, 1440px
3. Fix layout issues per viewport (padding, font size, grid columns)
4. Tambah `aria-label` pada semua `<section>`, `<nav>`, WA button
5. Pastikan semua `<img>` punya `alt` text
6. Verify keyboard navigation: Tab key berjalan natural dari Navbar ke Footer
7. Check color contrast di DevTools (Accessibility panel)
8. Run tests, confirm pass
9. Commit: `fix: responsive polish + accessibility`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] No horizontal scroll pada 320px viewport
- [ ] Semua breakpoints (320/768/1024/1440) tampil benar
- [ ] Keyboard Tab order natural
- [ ] Semua img punya alt text
- [ ] Contrast ratio ≥ 4.5:1 untuk body text

---

### Phase 12: Production Build + Docker Image

**Estimated time:** 15 menit

**Files:**
- Modify: `next.config.ts` — tambah `output: 'standalone'`
- Create: `.gitignore` (jika belum ada dari create-next-app)

**Steps:**
1. Write failing test (final): `npm run build` harus exit dengan code 0. Expected: clean build
2. Run `npm run build`, fix setiap error yang muncul
3. Run `npm run lint`, fix warnings
4. Tambah `output: 'standalone'` di `next.config.ts` (diperlukan Dockerfile multi-stage)
5. Build Docker image: `docker build -t kionix-interior:latest .`
6. Run production container: `docker run -p 3000:3000 kionix-interior:latest`
7. Test production container di `localhost:3000`: semua section, WA button, Maps embed
8. Init git: `git init && git add . && git commit -m "feat: Kionix Interior v1.0.0"`
9. Tag: `git tag v1.0.0`

**Untuk deploy ke server (opsional):**
- Push image: `docker tag kionix-interior:latest <registry>/kionix-interior:latest && docker push`
- Atau deploy ke VPS: copy `docker-compose.yml` + `docker pull` + `docker compose up -d`

**Verification:**
- [ ] `npm run build` clean (zero warnings/errors)
- [ ] `npm run lint` passes
- [ ] `docker build` sukses, image size < 200MB
- [ ] `docker run` — app accessible di `localhost:3000`
- [ ] WA floating button functional di browser
- [ ] Google Maps embed loads
- [ ] Page title benar di browser tab
- [ ] Tidak ada console errors

---

### Summary: Phase Order + Time Estimate

| Phase | Task | Est. Time |
|---|---|---|
| 0 | Project Bootstrap + Docker Dev | 15 mnt |
| 1 | Design System + Constants | 10 mnt |
| 2 | Navbar | 15 mnt |
| 3 | Hero Section | 20 mnt |
| 4 | Layanan Section | 15 mnt |
| 5 | Portfolio Section | 15 mnt |
| 6 | Tentang Kami | 12 mnt |
| 7 | Testimoni | 12 mnt |
| 8 | Kontak + Maps | 15 mnt |
| 9 | Footer + Floating WA | 12 mnt |
| 10 | Page Assembly + SEO | 10 mnt |
| 11 | Responsive + A11y | 15 mnt |
| 12 | Production Build + Docker Image | 15 mnt |
| **Total** | | **~2.5 jam** |

---

**Status:** Figma design selesai (file `vWA2zGbpXuk8xXc6Suqqoq`, teal palette `#26A1B0`, logo transparan uploaded). Siap eksekusi koding — jalankan `/gaspol-execute` untuk mulai dari Phase 0.

