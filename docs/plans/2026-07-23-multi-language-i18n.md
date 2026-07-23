# Multi-Language Support: EN, ID, Mandarin (Simplified)

> **For Claude:** REQUIRED SKILL: Use gaspol-execute to implement this plan.
> **CRITICAL:** This plan specifies real integrations. During execution,
> NEVER substitute placeholders for real data sources without explicit
> user approval. If a data source doesn't exist yet, STOP and ask.
> **Progress ledger — HARD PER-PHASE GATE:** `.gaspol/progress/multi-language-i18n.md`.
> After EACH phase and **BEFORE** starting the next, STOP and append that phase's
> line — status `done` + the exact command you ran and its result. This is
> **blocking**: no next phase until the line is written. Set `doing` when a phase
> starts, `done` when its tests pass. Never batch all updates at the end. Update
> ONLY this file — never the shared `.gaspol/progress.md`.
> **Self-contained:** this plan is the COMPLETE spec, executable by an agent with
> no other context (fresh post-`/compact` session, or an external executor that
> cannot see this chat). Every file path, contract, config key, and translation
> string it needs is written here verbatim.

## Goal

Add EN and Simplified Chinese (简体中文) alongside the existing Indonesian content,
using locale-prefixed URLs (`/`, `/en`, `/zh`) so each language is independently
indexable by Google. Root domain stays Indonesian with no URL change for existing
visitors/backlinks.

## Architecture Context

No `CLAUDE.md` exists in this repo (checked — not present). Project is a single-page
Next.js 14.2.35 App Router marketing site (`kionix-bootstrap`), deployed via Docker
(`output: 'standalone'`) to a VPS behind a Cloudflare Tunnel at `kionixinterior.com`.
No existing i18n code, no existing routing beyond the single `/` page. Existing
components (`src/components/*.tsx`) hold all UI copy as hardcoded Indonesian strings.

## Tech Stack

- **next-intl v4.13.4** (new dependency) — confirmed current standard for Next.js
  App Router i18n via research (see Design section above)
- Existing: Next.js 14.2.35, React 18, Tailwind CSS 3.4, Jest 30 + Testing Library
  16 (jsdom environment), TypeScript 5
- Existing test config: `jest.config.ts` uses `next/jest`, `moduleNameMapper`
  `^@/(.*)$` → `<rootDir>/src/$1`, setup file `jest.setup.ts` (imports
  `@testing-library/jest-dom` only — no providers)

## Design

### Goal
Support 3 languages (Indonesia default, English, Simplified Chinese/简体中文) with
SEO-friendly locale-prefixed URLs, so each language version is independently indexable
by Google.

### URL Structure
- `kionixinterior.com/` → Indonesian (default, no prefix)
- `kionixinterior.com/en` → English
- `kionixinterior.com/zh` → Simplified Chinese
- Decided against subdomain routing (extra Cloudflare Tunnel/DNS setup, no SEO benefit
  over path prefix) and against cookie/localStorage-only switching (bad for SEO — Google
  only indexes one language version).

### Library: next-intl
Confirmed via research (2026) as the current standard for Next.js App Router i18n,
over next-i18next (Pages Router legacy) and Intlayer (newer, less proven). Chosen over
hand-rolled Context+JSON because locale-prefix routing + middleware + hreflang generation
is more error-prone to build from scratch than adopting one well-maintained dependency.

Structure:
- `src/app/[locale]/` — all pages/layout move here (from `src/app/`)
- `middleware.ts` (project root) — locale detection, `localePrefix: 'as-needed'` so the
  default locale (`id`) has no prefix while `en`/`zh` do
- `src/messages/id.json`, `en.json`, `zh.json` — per-locale UI strings, namespaced by
  component (e.g. `nav.*`, `hero.*`, `kontak.*`)
- `Noto_Sans_SC` from `next/font/google` added for the `zh` locale — current fonts
  (Cormorant Garamond, Plus Jakarta Sans) are Latin-only and don't render Han characters

### Content Scope
All UI text across Navbar, Hero, Layanan, Portfolio, TentangKami, KlienKami, Testimoni
(including customer quotes — translated, not left in original Indonesian), Kontak, Footer.
Factual data (address, phone number, social links) stays untranslated — same across
locales via `lib/constants.ts` (unchanged).

`WaLeadModal.tsx` also gets localized: field labels ("Nama Anda" / "Your Name" / "您的姓名")
and the WhatsApp prefill message text, so the message sent to WhatsApp Business matches
the visitor's active locale.

Translation source: AI-translated (this session), all 3 languages. Recommend a native
speaker review before go-live, especially the Mandarin copy.

### Data Integration Map

| Component | Data Source | Existing? | Notes |
|---|---|---|---|
| All UI components | `messages/{id,en,zh}.json` | New | Key-based, namespaced per component |
| Navbar switcher | `next-intl` `useLocale()` + locale-aware `Link` | New | Reuses existing Navbar Tailwind styling — no new visual design needed |
| WaLeadModal prefill text | `messages/{locale}.json` → `kontak.waMessage` | New | Replaces hardcoded string in `src/components/WaLeadModal.tsx` |
| SEO metadata (title/desc/keywords/og) | Per-locale `generateMetadata()` in `app/[locale]/layout.tsx` | Modifies existing `layout.tsx` metadata | Includes `alternates.languages` (hreflang) |
| Address/phone/social links | `lib/constants.ts` | Existing, unchanged | Same across all locales |

### SEO Metadata Per Locale
Each locale gets its own `title`, `description`, and `keywords` — not literal translations
but locale-appropriate keyword research (e.g. EN: "interior design Batam", ZH: "巴淡岛室内设计").
`og:image` stays a single shared image (existing cropped kitchen-set photo) across all 3
locales — no need for 3 separate OG images.

`alternates.languages` (hreflang tags) added to every page so Google treats `/en` and `/zh`
as language alternates of the same page, not duplicate content — critical for correct
language-targeted search results.

### Testing Impact
Existing tests (`Navbar.test.tsx`, `Hero.test.tsx`, `Kontak.test.tsx`, `Footer.test.tsx`,
`Layanan.test.tsx`, `Portfolio.test.tsx`, `TentangKami.test.tsx`, `Testimoni.test.tsx`)
call `render(<Component />)` directly with no i18n context. Once components use
`useTranslations()`, they'll need a `renderWithIntl()` test helper that wraps render calls
in `NextIntlClientProvider` with the `id` locale messages as the default test fixture.

### Migration Mechanics
- `src/app/page.tsx` and `layout.tsx` → move to `src/app/[locale]/page.tsx` and `layout.tsx`
- New `middleware.ts` at project root for locale detection/redirect
- In-page anchor links (`#kontak`, `#layanan`, etc.) continue to work unchanged — relative
  to whatever locale is currently active
- Docker/standalone build (`output: 'standalone'`) is unaffected — next-intl works purely
  through App Router + middleware, no build config changes needed

## Implementation Plan

### Data Integration Map

| Feature | Data Source | Hook/API | Exists? | Action |
|---|---|---|---|---|
| Locale routing config | `src/i18n/routing.ts` | `next-intl/routing` `defineRouting` | No | Create new |
| Message loading per request | `src/i18n/request.ts` | `next-intl/server` `getRequestConfig` | No | Create new |
| Locale-aware `Link`/`useRouter` | `src/i18n/navigation.ts` | `next-intl/navigation` `createNavigation` | No | Create new |
| Locale detection/redirect | `middleware.ts` (project root) | `next-intl/middleware` `createMiddleware` | No | Create new |
| UI copy (all components) | `src/messages/{id,en,zh}.json` | `useTranslations()` (client) / `getTranslations()` (server) | No | Create new, full content below |
| Client Components (Navbar, Hero, Kontak, WaLeadModal, FloatingWA, Portfolio, TentangKami) | `NextIntlClientProvider` messages (from `[locale]/layout.tsx`) | `useTranslations('namespace')` | No | Convert existing components |
| Server Components (Layanan, Testimoni, KlienKami, Footer) | Same messages, server-side | `await getTranslations('namespace')` | No | Convert existing components (component fn becomes `async`) |
| SEO metadata per locale | `src/messages/{locale}.json` → `seo.*` keys | `generateMetadata()` in `app/[locale]/layout.tsx` | No | Replace existing static `metadata` export |
| Address / phone / social links | `src/lib/constants.ts` | Direct import | Yes | Use existing, unchanged — no translation |
| WhatsApp click tracking (`/api/wa-click`) | `src/app/api/wa-click/route.ts` | Existing route handler | Yes | No change — API routes are locale-agnostic, stay outside `[locale]` |
| Favicon (`icon.png`), OG image (`og-image.jpg`) | `src/app/icon.png`, `public/og-image.jpg` | Next.js file convention | Yes | No change — stay at `app/` root, apply to all locales |

**ponytail:** Layanan, Testimoni, KlienKami, Footer stay Server Components using
`getTranslations()` (async) rather than being converted to Client Components — avoids
adding unneeded client-side JS for content that has no interactivity.

---

### Phase 1: Install next-intl + routing infrastructure

**Estimated time:** 20 minutes

**Files:**
- Modify: `package.json` (add `next-intl` dependency)
- Modify: `next.config.mjs`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/request.ts`
- Create: `middleware.ts` (project root, next to `next.config.mjs`)
- Test: `src/__tests__/routing.test.ts`

**Steps:**

1. Write failing test for the routing config. Expected error:
   `Cannot find module '@/i18n/routing'`.

   `src/__tests__/routing.test.ts`:
   ```ts
   import { routing } from '@/i18n/routing'

   test('routing declares id, en, zh with id as default and no forced prefix', () => {
     expect(routing.locales).toEqual(['id', 'en', 'zh'])
     expect(routing.defaultLocale).toBe('id')
     expect(routing.localePrefix).toBe('as-needed')
   })
   ```

2. Run `npx jest src/__tests__/routing.test.ts`, confirm it fails with the expected
   module-not-found error.

3. Install the dependency:
   ```
   npm install next-intl@^4.13.4
   ```

4. Create `src/i18n/routing.ts`:
   ```ts
   import { defineRouting } from 'next-intl/routing'

   export const routing = defineRouting({
     locales: ['id', 'en', 'zh'],
     defaultLocale: 'id',
     localePrefix: 'as-needed',
   })
   ```

5. Create `src/i18n/navigation.ts`:
   ```ts
   import { createNavigation } from 'next-intl/navigation'
   import { routing } from './routing'

   export const { Link, redirect, usePathname, useRouter, getPathname } =
     createNavigation(routing)
   ```

6. Create `src/i18n/request.ts`:
   ```ts
   import { getRequestConfig } from 'next-intl/server'
   import { hasLocale } from 'next-intl'
   import { routing } from './routing'

   export default getRequestConfig(async ({ requestLocale }) => {
     const requested = await requestLocale
     const locale = hasLocale(routing.locales, requested)
       ? requested
       : routing.defaultLocale

     return {
       locale,
       messages: (await import(`../messages/${locale}.json`)).default,
     }
   })
   ```

7. Create `middleware.ts` at the project root (same level as `next.config.mjs`):
   ```ts
   import createMiddleware from 'next-intl/middleware'
   import { routing } from './src/i18n/routing'

   export default createMiddleware(routing)

   export const config = {
     matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
   }
   ```
   The matcher excludes `/api/*`, Next.js internals, and any path with a file
   extension (`/icon.png`, `/og-image.jpg`, `/images/*.jpg`, etc.) — so the
   WhatsApp tracking API and static assets are never locale-prefixed.

8. Update `next.config.mjs` to wrap the config with the next-intl plugin:
   ```mjs
   import createNextIntlPlugin from 'next-intl/plugin'

   const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone',
   }

   export default withNextIntl(nextConfig)
   ```

9. Run `npx jest src/__tests__/routing.test.ts`, confirm it passes.

10. Commit: `"feat: add next-intl routing config and middleware"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/routing.test.ts` passes
- [ ] `routing.locales`, `defaultLocale`, `localePrefix` match spec exactly
- [ ] No placeholder/TODO comments in new code

---

### Phase 2: Message dictionaries (id, en, zh) — full content

**Estimated time:** 15 minutes

**Files:**
- Create: `src/messages/id.json`
- Create: `src/messages/en.json`
- Create: `src/messages/zh.json`
- Test: `src/__tests__/messages.test.ts`

**Steps:**

1. Write failing test for key-parity across locales. Expected error:
   `Cannot find module '../messages/id.json'` (or similar resolution error since the
   files don't exist yet).

   `src/__tests__/messages.test.ts`:
   ```ts
   import id from '../messages/id.json'
   import en from '../messages/en.json'
   import zh from '../messages/zh.json'

   function flattenKeys(obj: unknown, prefix = ''): string[] {
     if (typeof obj !== 'object' || obj === null) return [prefix]
     return Object.entries(obj).flatMap(([k, v]) =>
       flattenKeys(v, prefix ? `${prefix}.${k}` : k)
     )
   }

   test('all three locales define the exact same set of message keys', () => {
     const idKeys = flattenKeys(id).sort()
     const enKeys = flattenKeys(en).sort()
     const zhKeys = flattenKeys(zh).sort()
     expect(enKeys).toEqual(idKeys)
     expect(zhKeys).toEqual(idKeys)
   })
   ```

2. Run `npx jest src/__tests__/messages.test.ts`, confirm it fails (module not found).

3. Create `src/messages/id.json` (Indonesian — matches current live copy verbatim):
   ```json
   {
     "nav": {
       "layanan": "LAYANAN",
       "portfolio": "PORTFOLIO",
       "tentang": "TENTANG",
       "kontak": "KONTAK",
       "cta": "Konsultasi Gratis →"
     },
     "hero": {
       "eyebrow": "JASA INTERIOR BATAM",
       "tagline": "Wujudkan Ruang Impian Anda",
       "subtitle": "Spesialis interior rumah, kantor, apartemen & hotel di Batam",
       "cta": "Konsultasi Gratis via WhatsApp →",
       "scrollCta": "↓ Lihat Layanan Kami"
     },
     "layanan": {
       "eyebrow": "APA YANG KAMI TAWARKAN",
       "title": "Layanan Kami",
       "kitchenSet": { "title": "Kitchen Set", "desc": "Desain dan instalasi kitchen set custom sesuai ukuran dapur Anda. Material premium, finishing rapi, fungsional dan estetik." },
       "lemariCustom": { "title": "Lemari Custom", "desc": "Lemari built-in dan wardrobe custom sesuai kebutuhan ruang dan selera Anda." },
       "backdropTv": { "title": "Backdrop TV", "desc": "Panel dinding TV yang elegan, menjadi focal point ruang tamu yang memukau." },
       "hotelApartemen": { "title": "Hotel & Apartemen", "desc": "Solusi interior lengkap untuk properti komersial — hotel, apartemen, villa, dan resort. Kami menghadirkan estetika yang selaras dengan identitas brand Anda." },
       "renovasiRumah": { "title": "Renovasi Rumah", "desc": "Renovasi total atau parsial dengan konsep modern dan material berkualitas." },
       "interiorKantor": { "title": "Interior Kantor", "desc": "Workspace profesional yang meningkatkan produktivitas dan citra bisnis Anda." }
     },
     "portfolio": {
       "eyebrow": "HASIL KARYA",
       "title": "Hasil Karya Kami",
       "close": "Tutup",
       "kitchenSet": { "title": "Kitchen Set", "category": "DAPUR" },
       "kamarTidur": { "title": "Kamar Tidur", "category": "BEDROOM" },
       "ruangTamu": { "title": "Ruang Tamu", "category": "LIVING ROOM" },
       "kantorModern": { "title": "Kantor Modern", "category": "OFFICE" },
       "backdropTv": { "title": "Backdrop TV", "category": "FEATURE WALL" },
       "retailBooth": { "title": "Retail Booth", "category": "RETAIL" },
       "lemariCustom": { "title": "Lemari Custom", "category": "STORAGE" },
       "apartemen": { "title": "Apartemen", "category": "RESIDENTIAL" },
       "renovasi": { "title": "Renovasi", "category": "RENOVATION" }
     },
     "tentang": {
       "eyebrow": "TENTANG KAMI",
       "title": "Tentang Kionix Interior",
       "desc": "Kionix Interior hadir untuk mewujudkan ruang impian Anda di Batam. Dengan tim berpengalaman dan komitmen terhadap kualitas, kami menghadirkan solusi interior yang memadukan estetika premium dengan kepraktisan sehari-hari.",
       "statProjects": "Proyek Selesai",
       "statClients": "Klien Puas",
       "statArea": "Area Layanan"
     },
     "klien": {
       "eyebrow": "KLIEN KAMI",
       "title": "Dipercaya Oleh"
     },
     "testimoni": {
       "eyebrow": "TESTIMONI",
       "title": "Apa Kata Klien Kami",
       "lamoist": { "quote": "\"Sangat puas dengan hasil pengerjaannya. Desain sesuai konsep yang kami inginkan, finishing rapi, pemasangan cepat, dan kualitas material sangat baik. Komunikasi selama proyek juga lancar sehingga semuanya berjalan tanpa kendala. Kios Lamoist sekarang tampil lebih premium dan menarik perhatian pelanggan. Highly recommended!\"", "role": "Pemilik Kios, Batam" },
       "sariDewi": { "quote": "\"Lemari custom yang dibuat pas dengan ruang kamar saya. Hasil akhir sangat memuaskan, harga kompetitif.\"", "role": "Penghuni Apartemen" },
       "majuBersama": { "quote": "\"Interior kantor kami sekarang terlihat lebih profesional. Kionix bekerja tepat waktu sesuai perjanjian.\"", "role": "Pemilik Kantor, Batam" }
     },
     "kontak": {
       "eyebrow": "HUBUNGI KAMI",
       "titleLine1": "Mulai Proyek",
       "titleLine2": "Impian Anda",
       "hours": "Senin–Sabtu: 08.00–17.00 WIB",
       "cta": "Mulai Proyek Anda →",
       "waMessage": "Halo Kionix, saya {name}, ingin konsultasi"
     },
     "waModal": {
       "heading": "Mulai Konsultasi",
       "subtitle": "Isi data Anda, kami lanjutkan di WhatsApp.",
       "namePlaceholder": "Nama Anda",
       "phonePlaceholder": "No. WhatsApp",
       "cancel": "Batal",
       "submit": "Lanjut →"
     },
     "floatingWa": {
       "ariaLabel": "Chat via WhatsApp",
       "tooltip": "Chat Sekarang"
     },
     "seo": {
       "title": "Kionix Interior — Batam",
       "description": "Spesialis interior rumah, kantor, apartemen & hotel di Batam",
       "keywords": ["jasa interior batam", "desain interior batam", "kontraktor interior batam", "interior rumah batam", "interior kantor batam", "interior apartemen batam", "interior hotel batam", "kitchen set batam", "lemari custom batam", "kionix interior"]
     }
   }
   ```

4. Create `src/messages/en.json` (English translation):
   ```json
   {
     "nav": {
       "layanan": "SERVICES",
       "portfolio": "PORTFOLIO",
       "tentang": "ABOUT",
       "kontak": "CONTACT",
       "cta": "Free Consultation →"
     },
     "hero": {
       "eyebrow": "INTERIOR DESIGN SERVICES BATAM",
       "tagline": "Bring Your Dream Space to Life",
       "subtitle": "Interior specialists for homes, offices, apartments & hotels in Batam",
       "cta": "Free Consultation via WhatsApp →",
       "scrollCta": "↓ View Our Services"
     },
     "layanan": {
       "eyebrow": "WHAT WE OFFER",
       "title": "Our Services",
       "kitchenSet": { "title": "Kitchen Set", "desc": "Custom kitchen set design and installation tailored to your kitchen's size. Premium materials, clean finishing, functional and aesthetic." },
       "lemariCustom": { "title": "Custom Wardrobe", "desc": "Built-in cabinets and custom wardrobes tailored to your space and taste." },
       "backdropTv": { "title": "TV Backdrop", "desc": "Elegant TV wall panels that become a stunning focal point in your living room." },
       "hotelApartemen": { "title": "Hotel & Apartment", "desc": "Complete interior solutions for commercial properties — hotels, apartments, villas, and resorts. We deliver aesthetics aligned with your brand identity." },
       "renovasiRumah": { "title": "Home Renovation", "desc": "Full or partial renovation with modern concepts and quality materials." },
       "interiorKantor": { "title": "Office Interior", "desc": "Professional workspaces that boost productivity and elevate your business image." }
     },
     "portfolio": {
       "eyebrow": "OUR WORK",
       "title": "Our Portfolio",
       "close": "Close",
       "kitchenSet": { "title": "Kitchen Set", "category": "KITCHEN" },
       "kamarTidur": { "title": "Bedroom", "category": "BEDROOM" },
       "ruangTamu": { "title": "Living Room", "category": "LIVING ROOM" },
       "kantorModern": { "title": "Modern Office", "category": "OFFICE" },
       "backdropTv": { "title": "TV Backdrop", "category": "FEATURE WALL" },
       "retailBooth": { "title": "Retail Booth", "category": "RETAIL" },
       "lemariCustom": { "title": "Custom Wardrobe", "category": "STORAGE" },
       "apartemen": { "title": "Apartment", "category": "RESIDENTIAL" },
       "renovasi": { "title": "Renovation", "category": "RENOVATION" }
     },
     "tentang": {
       "eyebrow": "ABOUT US",
       "title": "About Kionix Interior",
       "desc": "Kionix Interior is here to bring your dream space to life in Batam. With an experienced team and a commitment to quality, we deliver interior solutions that blend premium aesthetics with everyday practicality.",
       "statProjects": "Projects Completed",
       "statClients": "Satisfied Clients",
       "statArea": "Service Area"
     },
     "klien": {
       "eyebrow": "OUR CLIENTS",
       "title": "Trusted By"
     },
     "testimoni": {
       "eyebrow": "TESTIMONIALS",
       "title": "What Our Clients Say",
       "lamoist": { "quote": "\"Very satisfied with the results. The design matched exactly what we wanted, the finishing was neat, installation was fast, and material quality was excellent. Communication throughout the project was smooth so everything ran without issues. Kios Lamoist now looks more premium and catches customers' attention. Highly recommended!\"", "role": "Shop Owner, Batam" },
       "sariDewi": { "quote": "\"The custom wardrobe was made to fit perfectly with my room. The final result was very satisfying, and the price was competitive.\"", "role": "Apartment Resident" },
       "majuBersama": { "quote": "\"Our office interior now looks more professional. Kionix worked on time as agreed.\"", "role": "Office Owner, Batam" }
     },
     "kontak": {
       "eyebrow": "CONTACT US",
       "titleLine1": "Start Your",
       "titleLine2": "Dream Project",
       "hours": "Monday–Saturday: 08:00–17:00 WIB",
       "cta": "Start Your Project →",
       "waMessage": "Hello Kionix, I'm {name}, I'd like a consultation"
     },
     "waModal": {
       "heading": "Start a Consultation",
       "subtitle": "Fill in your details, we'll continue on WhatsApp.",
       "namePlaceholder": "Your Name",
       "phonePlaceholder": "WhatsApp Number",
       "cancel": "Cancel",
       "submit": "Continue →"
     },
     "floatingWa": {
       "ariaLabel": "Chat via WhatsApp",
       "tooltip": "Chat Now"
     },
     "seo": {
       "title": "Kionix Interior — Interior Design in Batam",
       "description": "Interior design specialists for homes, offices, apartments & hotels in Batam, Indonesia",
       "keywords": ["interior design batam", "batam interior designer", "kitchen set batam", "custom wardrobe batam", "office interior batam", "apartment interior batam", "hotel interior batam", "home renovation batam", "kionix interior", "interior contractor batam"]
     }
   }
   ```

5. Create `src/messages/zh.json` (Simplified Chinese translation):
   ```json
   {
     "nav": {
       "layanan": "服务",
       "portfolio": "作品集",
       "tentang": "关于我们",
       "kontak": "联系我们",
       "cta": "免费咨询 →"
     },
     "hero": {
       "eyebrow": "巴淡岛室内设计服务",
       "tagline": "打造您梦想中的空间",
       "subtitle": "巴淡岛住宅、办公室、公寓与酒店室内设计专家",
       "cta": "通过WhatsApp免费咨询 →",
       "scrollCta": "↓ 查看我们的服务"
     },
     "layanan": {
       "eyebrow": "我们提供的服务",
       "title": "我们的服务",
       "kitchenSet": { "title": "定制厨房", "desc": "根据您的厨房尺寸定制设计与安装厨房橱柜。采用优质材料，做工精细，兼具实用与美观。" },
       "lemariCustom": { "title": "定制衣柜", "desc": "根据您的空间需求与喜好定制嵌入式衣柜与储物柜。" },
       "backdropTv": { "title": "电视背景墙", "desc": "优雅的电视背景墙面板，成为客厅令人惊艳的视觉焦点。" },
       "hotelApartemen": { "title": "酒店与公寓", "desc": "为商业物业提供完整的室内设计方案——酒店、公寓、别墅与度假村。我们打造与您品牌形象相契合的美学风格。" },
       "renovasiRumah": { "title": "房屋翻新", "desc": "提供全面或局部翻新服务，采用现代设计理念与优质材料。" },
       "interiorKantor": { "title": "办公室室内设计", "desc": "专业的办公空间，提升工作效率与企业形象。" }
     },
     "portfolio": {
       "eyebrow": "作品展示",
       "title": "我们的作品",
       "close": "关闭",
       "kitchenSet": { "title": "定制厨房", "category": "厨房" },
       "kamarTidur": { "title": "卧室", "category": "卧室" },
       "ruangTamu": { "title": "客厅", "category": "客厅" },
       "kantorModern": { "title": "现代办公室", "category": "办公室" },
       "backdropTv": { "title": "电视背景墙", "category": "特色墙面" },
       "retailBooth": { "title": "零售展位", "category": "零售" },
       "lemariCustom": { "title": "定制衣柜", "category": "收纳" },
       "apartemen": { "title": "公寓", "category": "住宅" },
       "renovasi": { "title": "翻新", "category": "翻新" }
     },
     "tentang": {
       "eyebrow": "关于我们",
       "title": "关于 Kionix Interior",
       "desc": "Kionix Interior 致力于在巴淡岛为您打造梦想空间。凭借经验丰富的团队与对品质的坚持，我们提供兼具高端美学与实用性的室内设计方案。",
       "statProjects": "已完成项目",
       "statClients": "客户满意度",
       "statArea": "服务区域"
     },
     "klien": {
       "eyebrow": "我们的客户",
       "title": "客户信赖"
     },
     "testimoni": {
       "eyebrow": "客户评价",
       "title": "客户怎么说",
       "lamoist": { "quote": "\"对施工成果非常满意。设计完全符合我们的构想，做工精细，安装迅速，材料品质优良。项目期间沟通顺畅，一切进行得很顺利。Lamoist 店铺现在看起来更加高端，吸引了顾客的注意。强烈推荐！\"", "role": "店主，巴淡岛" },
       "sariDewi": { "quote": "\"定制的衣柜与我的房间空间完美契合。最终成果非常令人满意，价格也很有竞争力。\"", "role": "公寓住户" },
       "majuBersama": { "quote": "\"我们的办公室室内设计现在看起来更加专业。Kionix 按约定准时完成工作。\"", "role": "办公室业主，巴淡岛" }
     },
     "kontak": {
       "eyebrow": "联系我们",
       "titleLine1": "开启您的",
       "titleLine2": "梦想项目",
       "hours": "周一至周六：08:00–17:00（西印尼时间）",
       "cta": "开启您的项目 →",
       "waMessage": "您好 Kionix，我是{name}，想咨询一下"
     },
     "waModal": {
       "heading": "开始咨询",
       "subtitle": "填写您的信息，我们将在WhatsApp上继续沟通。",
       "namePlaceholder": "您的姓名",
       "phonePlaceholder": "WhatsApp 号码",
       "cancel": "取消",
       "submit": "继续 →"
     },
     "floatingWa": {
       "ariaLabel": "通过WhatsApp聊天",
       "tooltip": "立即聊天"
     },
     "seo": {
       "title": "Kionix Interior — 巴淡岛室内设计",
       "description": "巴淡岛住宅、办公室、公寓与酒店室内设计专家",
       "keywords": ["巴淡岛室内设计", "巴淡岛室内设计师", "定制厨房巴淡岛", "定制衣柜巴淡岛", "办公室室内设计巴淡岛", "公寓室内设计巴淡岛", "酒店室内设计巴淡岛", "房屋翻新巴淡岛", "Kionix Interior", "巴淡岛室内设计承包商"]
     }
   }
   ```

6. Run `npx jest src/__tests__/messages.test.ts`, confirm it passes.

7. Commit: `"feat: add id/en/zh message dictionaries"`

**Verification:**
- [ ] `npx jest src/__tests__/messages.test.ts` passes (key parity across all 3 locales)
- [ ] All 3 JSON files are valid JSON (`node -e "require('./src/messages/id.json')"` etc. — or the test importing them already proves this)
- [ ] No placeholder/TODO comments or `"TBD"` values in any message file

---

### Phase 3: App Router restructure to `[locale]` + provider wiring

**Estimated time:** 20 minutes

**Files:**
- Create: `src/app/[locale]/layout.tsx` (moved + modified from `src/app/layout.tsx`)
- Create: `src/app/[locale]/page.tsx` (moved from `src/app/page.tsx`)
- Delete: `src/app/layout.tsx`
- Delete: `src/app/page.tsx`
- Keep unchanged: `src/app/api/wa-click/route.ts`, `src/app/icon.png`, `src/app/globals.css`
- Test: `src/__tests__/smoke.test.ts` (existing — update import path if it references `app/page`)

**Steps:**

1. Write failing test confirming the locale layout exports `generateStaticParams`
   covering all 3 locales. Expected error: `Cannot find module '@/app/[locale]/layout'`.

   Add to a new file `src/__tests__/localeLayout.test.ts`:
   ```ts
   import { generateStaticParams } from '@/app/[locale]/layout'

   test('generateStaticParams returns all 3 locales', async () => {
     const params = await generateStaticParams()
     expect(params.map((p: { locale: string }) => p.locale).sort()).toEqual(['en', 'id', 'zh'])
   })
   ```

2. Run `npx jest src/__tests__/localeLayout.test.ts`, confirm it fails (module not found).

3. Move `src/app/page.tsx` to `src/app/[locale]/page.tsx` — content unchanged for now
   (component-level translation happens in later phases):
   ```tsx
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
   ```

4. Create `src/app/[locale]/layout.tsx` (fonts/Navbar/FloatingWA/WaLeadModal preserved
   from the current root layout, `metadata` export kept as-is for now — Phase 9
   replaces it with `generateMetadata`):
   ```tsx
   import type { Metadata } from "next";
   import { NextIntlClientProvider } from 'next-intl';
   import { getMessages, setRequestLocale } from 'next-intl/server';
   import { notFound } from 'next/navigation';
   import { Cormorant_Garamond, Plus_Jakarta_Sans, Noto_Sans_SC } from "next/font/google";
   import { routing } from '@/i18n/routing';
   import Navbar from "@/components/Navbar";
   import FloatingWA from "@/components/FloatingWA";
   import WaLeadModal from "@/components/WaLeadModal";
   import "../globals.css";

   const cormorant = Cormorant_Garamond({
     subsets: ["latin"],
     weight: ["400", "500", "600", "700"],
     style: ["normal", "italic"],
     variable: "--font-cormorant",
     display: "swap",
   });

   const jakarta = Plus_Jakarta_Sans({
     subsets: ["latin"],
     weight: ["400", "500", "600", "700"],
     variable: "--font-jakarta",
     display: "swap",
   });

   const notoSansSC = Noto_Sans_SC({
     subsets: ["latin"],
     weight: ["400", "500", "700"],
     variable: "--font-noto-sc",
     display: "swap",
   });

   export const metadata: Metadata = {
     title: "Kionix Interior — Batam",
     description: "Spesialis interior rumah, kantor, apartemen & hotel di Batam",
   };

   export function generateStaticParams() {
     return routing.locales.map((locale) => ({ locale }));
   }

   export default async function RootLayout({
     children,
     params,
   }: {
     children: React.ReactNode;
     params: Promise<{ locale: string }>;
   }) {
     const { locale } = await params;
     if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
       notFound();
     }
     setRequestLocale(locale);
     const messages = await getMessages();

     return (
       <html lang={locale} className={`${cormorant.variable} ${jakarta.variable} ${notoSansSC.variable}`}>
         <body className="font-sans antialiased">
           <NextIntlClientProvider messages={messages}>
             <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded">
               Skip to content
             </a>
             <Navbar />
             <div id="main-content">{children}</div>
             <FloatingWA />
             <WaLeadModal />
           </NextIntlClientProvider>
         </body>
       </html>
     );
   }
   ```
   Note: `generateStaticParams` is exported as a plain function (not the test's async
   expectation literally, but calling a sync function with `await` in the test works
   fine in JS/TS — `await` on a non-Promise value just resolves immediately).

5. Delete `src/app/layout.tsx` and `src/app/page.tsx` (now superseded by the
   `[locale]` versions).

6. Update `tailwind.config.ts` `content` globs if they don't already cover
   `src/app/**/*.{ts,tsx}` recursively (check existing glob — Next.js App Router
   dynamic segments like `[locale]` are just directories, standard globs already
   match them; no change expected, but confirm before moving on).

7. Run `npx jest src/__tests__/localeLayout.test.ts`, confirm it passes.

8. Run `npx next build` — this is the real end-to-end check for App Router
   restructuring (Jest/jsdom cannot execute Next.js routing/middleware). Confirm
   build succeeds and the route list shows `/[locale]` as a static/dynamic route.

9. Commit: `"feat: restructure app router under [locale] segment"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/localeLayout.test.ts` passes
- [ ] `npx next build` succeeds with no errors
- [ ] No placeholder/TODO comments in new code

---

### Phase 4: Test helper `renderWithIntl` + migrate Navbar

**Estimated time:** 15 minutes

**Files:**
- Create: `src/__tests__/test-utils.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/__tests__/Navbar.test.tsx`

**Steps:**

1. Write failing test using the not-yet-created helper. Expected error:
   `Cannot find module './test-utils'`.

   Rewrite `src/__tests__/Navbar.test.tsx`:
   ```tsx
   import { screen, fireEvent } from '@testing-library/react'
   import { renderWithIntl } from './test-utils'
   import Navbar from '@/components/Navbar'

   test('Navbar renders translated nav links and WA CTA opens lead modal', () => {
     const handler = jest.fn()
     window.addEventListener('open-wa-modal', handler)
     renderWithIntl(<Navbar />)
     expect(screen.getByText('LAYANAN')).toBeInTheDocument()
     fireEvent.click(screen.getByRole('button', { name: /konsultasi gratis/i }))
     expect(handler).toHaveBeenCalledTimes(1)
     window.removeEventListener('open-wa-modal', handler)
   })
   ```

2. Run `npx jest src/__tests__/Navbar.test.tsx`, confirm it fails (module not found).

3. Create `src/__tests__/test-utils.tsx`:
   ```tsx
   import { render } from '@testing-library/react'
   import { NextIntlClientProvider } from 'next-intl'
   import type { ReactElement } from 'react'
   import messages from '../messages/id.json'

   export function renderWithIntl(ui: ReactElement, locale = 'id') {
     return render(
       <NextIntlClientProvider locale={locale} messages={messages}>
         {ui}
       </NextIntlClientProvider>
     )
   }
   ```
   `id.json` is the default test fixture locale (per Design section decision).

4. Update `src/components/Navbar.tsx`: replace hardcoded strings with
   `useTranslations('nav')`. Key changes only (rest of component structure unchanged):
   ```tsx
   'use client'

   import Image from 'next/image'
   import Link from 'next/link'
   import { useState, useEffect } from 'react'
   import { useTranslations } from 'next-intl'
   import { Menu, X } from 'lucide-react'
   import { openWaModal } from '@/components/WaLeadModal'

   const navKeys = ['layanan', 'portfolio', 'tentang', 'kontak'] as const
   const navHrefs: Record<(typeof navKeys)[number], string> = {
     layanan: '#layanan',
     portfolio: '#portfolio',
     tentang: '#tentang',
     kontak: '#kontak',
   }

   export default function Navbar() {
     const t = useTranslations('nav')
     const [scrolled, setScrolled] = useState(false)
     const [open, setOpen] = useState(false)

     useEffect(() => {
       const onScroll = () => setScrolled(window.scrollY > 10)
       window.addEventListener('scroll', onScroll)
       return () => window.removeEventListener('scroll', onScroll)
     }, [])

     return (
       <nav
         className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 md:px-20 h-16 transition-all duration-200 ${
           scrolled
             ? 'backdrop-blur-md bg-white/90 shadow-sm border-b border-border'
             : 'bg-white border-b border-border'
         }`}
       >
         <Link href="/" className="relative w-12 h-12 shrink-0">
           <Image src="/logo.png" alt="Kionix Interior" fill className="object-contain" priority />
         </Link>

         <ul className="hidden md:flex gap-10 items-center">
           {navKeys.map((key) => (
             <li key={key}>
               <a
                 href={navHrefs[key]}
                 className="font-sans font-semibold text-xs tracking-widest text-bg-dark hover:text-accent transition-colors"
               >
                 {t(key).toUpperCase()}
               </a>
             </li>
           ))}
         </ul>

         <button
           type="button"
           onClick={() => openWaModal('navbar-desktop')}
           className="hidden md:inline-flex items-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-xs px-6 py-3 rounded transition-colors"
         >
           {t('cta')}
         </button>

         <button
           className="md:hidden p-2 text-bg-dark"
           onClick={() => setOpen(!open)}
           aria-label="Toggle menu"
         >
           {open ? <X size={24} /> : <Menu size={24} />}
         </button>

         {open && (
           <div className="absolute top-16 inset-x-0 bg-white border-b border-border shadow-md md:hidden">
             <ul className="flex flex-col py-4">
               {navKeys.map((key) => (
                 <li key={key}>
                   <a
                     href={navHrefs[key]}
                     className="block px-5 py-3 font-sans font-semibold text-xs tracking-widest text-bg-dark hover:text-accent"
                     onClick={() => setOpen(false)}
                   >
                     {t(key).toUpperCase()}
                   </a>
                 </li>
               ))}
               <li className="px-5 pt-3">
                 <button
                   type="button"
                   onClick={() => {
                     setOpen(false)
                     openWaModal('navbar-mobile')
                   }}
                   className="block w-full text-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-xs px-6 py-3 rounded transition-colors"
                 >
                   {t('cta')}
                 </button>
               </li>
             </ul>
           </div>
         )}
       </nav>
     )
   }
   ```
   Note: `id.json`'s `nav.layanan` etc. are already uppercase Indonesian strings
   ("LAYANAN") so `.toUpperCase()` is a no-op there; it exists so `en.json`/`zh.json`
   nav keys could be written in normal case and still render uppercase per the
   existing visual style — but since all 3 dictionaries above are already authored
   in the correct display case, `.toUpperCase()` is redundant for zh (Chinese has no
   case) and safe no-op for the others. Keep it for robustness; do not remove.

5. Run `npx jest src/__tests__/Navbar.test.tsx`, confirm it passes.

6. Commit: `"feat: migrate Navbar to next-intl translations"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/Navbar.test.tsx` passes
- [ ] Navbar renders real translated text from `messages/id.json` (not hardcoded)
- [ ] No placeholder/TODO comments in new code

---

### Phase 5: Migrate Hero, Kontak, WaLeadModal

**Estimated time:** 20 minutes

**Files:**
- Modify: `src/components/Hero.tsx`, `src/components/Kontak.tsx`, `src/components/WaLeadModal.tsx`
- Modify: `src/__tests__/Hero.test.tsx`, `src/__tests__/Kontak.test.tsx`

**Steps:**

1. Write failing test for Hero using `renderWithIntl`. Expected error:
   assertion failure on `screen.getByRole('button', { name: /konsultasi gratis via whatsapp/i })`
   because Hero still renders the old hardcoded JSX until step 3.

   Rewrite `src/__tests__/Hero.test.tsx`:
   ```tsx
   import { screen, fireEvent } from '@testing-library/react'
   import { renderWithIntl } from './test-utils'
   import Hero from '@/components/Hero'

   test('Hero WA CTA opens the lead modal with translated label', () => {
     const handler = jest.fn()
     window.addEventListener('open-wa-modal', handler)
     renderWithIntl(<Hero />)
     expect(screen.getByText('Wujudkan Ruang Impian Anda')).toBeInTheDocument()
     fireEvent.click(screen.getByRole('button', { name: /konsultasi gratis via whatsapp/i }))
     expect(handler).toHaveBeenCalledTimes(1)
     window.removeEventListener('open-wa-modal', handler)
   })
   ```

2. Run it, confirm it fails (Hero not yet using `useTranslations`, so
   `NextIntlClientProvider` context is unused but the text assertion for the
   translation-sourced string still happens to match today's hardcoded copy —
   the REAL failure to check for at this step is a TypeScript/runtime error if
   Hero calls `useTranslations` before the JSON exists, OR simply run the test
   as-is against the CURRENT Hero.tsx and confirm the CTA button test still
   passes trivially — then proceed to step 3's refactor and re-run as the actual
   regression check. Either way, do not skip running it before AND after the change.

3. Update `src/components/Hero.tsx` — replace hardcoded strings with
   `useTranslations('hero')`:
   ```tsx
   'use client'
   import { useState, useEffect } from 'react'
   import { AnimatePresence, motion } from 'framer-motion'
   import Image from 'next/image'
   import { useTranslations } from 'next-intl'
   import { openWaModal } from '@/components/WaLeadModal'

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
     const t = useTranslations('hero')
     const [idx, setIdx] = useState(0)

     useEffect(() => {
       const timer = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000)
       return () => clearInterval(timer)
     }, [])

     return (
       <section className="relative flex min-h-screen overflow-hidden pt-16" aria-label="Hero">
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

         <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/85 to-bg-dark/40 pointer-events-none" />

         <div className="relative z-10 flex w-full flex-col justify-center px-8 py-20 md:w-3/5 md:px-20">
           <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
             {t('eyebrow')}
           </span>

           <div className="mt-6 h-0.5 w-12 bg-accent" />

           <h1 className="mt-4 font-serif font-bold leading-[0.95] tracking-wide text-text-on-dark text-6xl md:text-8xl">
             KIONIX<br />INTERIOR
           </h1>

           <p className="mt-8 font-serif italic font-medium text-2xl md:text-3xl text-text-on-dark">
             {t('tagline')}
           </p>

           <p className="mt-5 font-sans text-base leading-relaxed text-text-muted max-w-lg">
             {t('subtitle')}
           </p>

           <button
             type="button"
             onClick={() => openWaModal('hero')}
             className="mt-12 inline-flex w-fit items-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-sm px-8 py-4 rounded transition-colors"
           >
             {t('cta')}
           </button>

           <a
             href="#layanan"
             className="mt-4 font-sans text-xs tracking-widest text-text-muted hover:text-accent transition-colors"
           >
             {t('scrollCta')}
           </a>
         </div>

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
   ```

4. Run `npx jest src/__tests__/Hero.test.tsx`, confirm it passes.

5. Write failing test for Kontak using `renderWithIntl`:

   Rewrite `src/__tests__/Kontak.test.tsx`:
   ```tsx
   import { screen, fireEvent } from '@testing-library/react'
   import { renderWithIntl } from './test-utils'
   import Kontak from '@/components/Kontak'

   test('Kontak WA CTA opens lead modal and renders address', () => {
     const handler = jest.fn()
     window.addEventListener('open-wa-modal', handler)
     renderWithIntl(<Kontak />)
     fireEvent.click(screen.getByRole('button', { name: /mulai proyek/i }))
     expect(handler).toHaveBeenCalledTimes(1)
     expect(screen.getByText(/Ciptaland/)).toBeInTheDocument()
     window.removeEventListener('open-wa-modal', handler)
   })
   ```

6. Run it against the current (pre-migration) `Kontak.tsx`, confirm it still
   passes as-is (sanity baseline before refactor), then proceed to step 7.

7. Update `src/components/Kontak.tsx`:
   ```tsx
   'use client'

   import { useTranslations } from 'next-intl'
   import { openWaModal } from '@/components/WaLeadModal'

   export default function Kontak() {
     const t = useTranslations('kontak')

     const info = [
       { icon: '📍', text: 'Ruko Ciptaland Blok Lavender No.26, Batam' },
       { icon: '📱', text: '0813-7270-3589' },
       { icon: '🕐', text: t('hours') },
     ]

     return (
       <section id="kontak" className="bg-white px-5 py-24 md:px-20">
         <div className="mx-auto flex max-w-7xl flex-col gap-16 md:flex-row md:items-start">
           <div className="flex flex-col gap-6 md:w-[560px]">
             <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
               {t('eyebrow')}
             </span>
             <h2 className="font-serif text-4xl font-bold leading-tight text-bg-dark">
               {t('titleLine1')}<br />{t('titleLine2')}
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

             <button
               type="button"
               onClick={() => openWaModal('kontak')}
               className="inline-flex w-fit items-center bg-accent hover:bg-accent-hover text-text-on-dark font-sans font-bold text-sm px-8 py-4 rounded transition-colors"
             >
               {t('cta')}
             </button>
           </div>

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
   ```
   Address and phone number stay hardcoded (factual data, unchanged across locales
   per Design section). Only `hours` comes from translations since it involves day
   names.

8. Update `src/components/WaLeadModal.tsx`: replace hardcoded labels and the
   WhatsApp prefill message with translation keys. Key changes:
   ```tsx
   'use client'

   import { useEffect, useState, type FormEvent } from 'react'
   import { useTranslations } from 'next-intl'
   import { WHATSAPP_URL } from '@/lib/constants'
   import { trackWaClick } from '@/lib/trackWaClick'

   export function openWaModal(source: string) {
     window.dispatchEvent(new CustomEvent('open-wa-modal', { detail: { source } }))
   }

   export default function WaLeadModal() {
     const t = useTranslations('waModal')
     const tKontak = useTranslations('kontak')
     const [open, setOpen] = useState(false)
     const [source, setSource] = useState('')
     const [name, setName] = useState('')
     const [phone, setPhone] = useState('')

     useEffect(() => {
       const handler = (e: Event) => {
         setSource((e as CustomEvent<{ source: string }>).detail.source)
         setOpen(true)
       }
       window.addEventListener('open-wa-modal', handler)
       return () => window.removeEventListener('open-wa-modal', handler)
     }, [])

     if (!open) return null

     function handleSubmit(e: FormEvent) {
       e.preventDefault()
       const trimmedName = name.trim()
       const trimmedPhone = phone.trim()
       if (!trimmedName || !trimmedPhone) return

       trackWaClick(source, { name: trimmedName, phone: trimmedPhone })
       const text = encodeURIComponent(tKontak('waMessage', { name: trimmedName }))
       window.open(`${WHATSAPP_URL}?text=${text}`, '_blank', 'noopener,noreferrer')

       setOpen(false)
       setName('')
       setPhone('')
     }

     return (
       <div
         className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5"
         onClick={() => setOpen(false)}
       >
         <form
           onClick={e => e.stopPropagation()}
           onSubmit={handleSubmit}
           className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
         >
           <h3 className="font-serif text-xl font-bold text-bg-dark">{t('heading')}</h3>
           <p className="mt-1 font-sans text-sm text-text-muted">{t('subtitle')}</p>

           <div className="mt-5 flex flex-col gap-3">
             <input
               type="text"
               required
               placeholder={t('namePlaceholder')}
               value={name}
               onChange={e => setName(e.target.value)}
               className="rounded border border-border px-4 py-2.5 font-sans text-sm text-bg-dark outline-none focus:border-accent"
             />
             <input
               type="tel"
               required
               placeholder={t('phonePlaceholder')}
               value={phone}
               onChange={e => setPhone(e.target.value)}
               className="rounded border border-border px-4 py-2.5 font-sans text-sm text-bg-dark outline-none focus:border-accent"
             />
           </div>

           <div className="mt-5 flex gap-3">
             <button
               type="button"
               onClick={() => setOpen(false)}
               className="flex-1 rounded border border-border py-2.5 font-sans text-sm font-semibold text-bg-dark"
             >
               {t('cancel')}
             </button>
             <button
               type="submit"
               className="flex-1 rounded bg-accent py-2.5 font-sans text-sm font-bold text-text-on-dark transition-colors hover:bg-accent-hover"
             >
               {t('submit')}
             </button>
           </div>
         </form>
       </div>
     )
   }
   ```
   `tKontak('waMessage', { name: trimmedName })` uses next-intl's built-in ICU
   `{name}` placeholder interpolation — the `kontak.waMessage` string in each
   locale JSON already contains the literal `{name}` token (see Phase 2 content).

9. Run `npx jest src/__tests__/Hero.test.tsx src/__tests__/Kontak.test.tsx`,
   confirm both pass.

10. Commit: `"feat: migrate Hero, Kontak, WaLeadModal to next-intl translations"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/Hero.test.tsx src/__tests__/Kontak.test.tsx` passes
- [ ] WhatsApp prefill message correctly interpolates the visitor's entered name
  (manual check: open modal, type a name, submit, confirm the `wa.me` URL's `text`
  param contains that name)
- [ ] No placeholder/TODO comments in new code

---

### Phase 6: Migrate Footer, FloatingWA

**Estimated time:** 15 minutes

**Files:**
- Modify: `src/components/Footer.tsx` (Server Component — uses `getTranslations`)
- Modify: `src/components/FloatingWA.tsx` (Client Component — uses `useTranslations`)
- Modify: `src/__tests__/Footer.test.tsx`

**Steps:**

1. Write failing test for Footer as an async Server Component. Expected error:
   `screen.getByText(/Kionix Interior/)` throws because `Footer()` still returns
   a plain (non-Promise) element pre-migration — confirm this by running the
   CURRENT test first (baseline), then apply the migration and re-run.

   Rewrite `src/__tests__/Footer.test.tsx`:
   ```tsx
   import { render, screen } from '@testing-library/react'
   import { NextIntlClientProvider } from 'next-intl'
   import messages from '../messages/id.json'
   import Footer from '@/components/Footer'

   test('Footer renders copyright and social links', async () => {
     const ui = await Footer()
     render(
       <NextIntlClientProvider locale="id" messages={messages}>
         {ui}
       </NextIntlClientProvider>
     )
     expect(screen.getByText(/Kionix Interior/)).toBeInTheDocument()
     const instagram = screen.getByRole('link', { name: /instagram/i })
     expect(instagram).toHaveAttribute('href', expect.stringContaining('instagram.com/kionixinterior'))
   })
   ```
   `await Footer()` works because in the Jest environment the async Server
   Component is just an async function — calling and awaiting it directly
   returns its JSX, which RTL's `render()` can then mount normally.

2. Run it, confirm it fails (Footer isn't `async` yet, `await Footer()` returns
   the JSX synchronously wrapped in a resolved promise — actually this specific
   case may not "fail" cleanly since awaiting a non-Promise still resolves; the
   REAL pre-migration failure is that `Footer.tsx` doesn't import from `next-intl`
   at all yet, which is fine — the test still passes trivially against current
   hardcoded content. Confirm current pass, then migrate in step 3, then re-run
   as the regression check — same pattern as Phase 5 step 2.

3. Update `src/components/Footer.tsx` to an async Server Component using
   `getTranslations`. Nav links currently duplicate `#layanan` etc. — reuse the
   `nav` namespace (already created in Phase 2) instead of a separate `footer`
   namespace:
   ```tsx
   import Image from 'next/image'
   import { getTranslations } from 'next-intl/server'
   import { INSTAGRAM_URL, TIKTOK_URL } from '@/lib/constants'

   const navKeys = ['layanan', 'portfolio', 'tentang', 'kontak'] as const
   const navHrefs: Record<(typeof navKeys)[number], string> = {
     layanan: '#layanan',
     portfolio: '#portfolio',
     tentang: '#tentang',
     kontak: '#kontak',
   }

   export default async function Footer() {
     const t = await getTranslations('nav')

     return (
       <footer className="bg-bg-dark px-5 py-10 md:px-20">
         <div className="mx-auto max-w-7xl">
           <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
             <div className="relative h-16 w-16">
               <Image src="/logo.png" alt="Kionix Interior" fill className="object-contain brightness-0 invert" />
             </div>
             <nav className="flex flex-wrap gap-8">
               {navKeys.map((key) => (
                 <a
                   key={key}
                   href={navHrefs[key]}
                   className="font-sans font-medium text-sm text-text-on-dark hover:text-accent transition-colors"
                 >
                   {t(key)}
                 </a>
               ))}
             </nav>

             <div className="flex gap-4">
               <a
                 href={INSTAGRAM_URL}
                 target="_blank"
                 rel="noopener noreferrer"
                 aria-label="Instagram Kionix Interior"
                 className="text-text-on-dark hover:text-accent transition-colors"
               >
                 <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                   <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                 </svg>
               </a>
               <a
                 href={TIKTOK_URL}
                 target="_blank"
                 rel="noopener noreferrer"
                 aria-label="TikTok Kionix Interior"
                 className="text-text-on-dark hover:text-accent transition-colors"
               >
                 <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                   <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z" />
                 </svg>
               </a>
             </div>
           </div>

           <div className="mt-6 h-px bg-white/10" />

           <div className="mt-5 flex flex-col gap-2 md:flex-row md:justify-between">
             <p className="font-sans text-xs text-text-on-dark">© 2025 Kionix Interior. Batam.</p>
             <p className="font-sans text-xs text-text-on-dark">Ruko Ciptaland Blok Lavender No.26, Batam</p>
           </div>
         </div>
       </footer>
     )
   }
   ```
   Copyright line and address stay hardcoded (factual/brand data, unchanged across
   locales, per Design section).

4. Update `src/components/FloatingWA.tsx` to use `useTranslations`:
   ```tsx
   'use client'

   import { motion } from 'framer-motion'
   import { MessageCircle } from 'lucide-react'
   import { useTranslations } from 'next-intl'
   import { openWaModal } from '@/components/WaLeadModal'

   export default function FloatingWA() {
     const t = useTranslations('floatingWa')

     return (
       <button
         type="button"
         onClick={() => openWaModal('floating')}
         aria-label={t('ariaLabel')}
         className="fixed bottom-6 right-6 z-50 group"
       >
         <motion.div
           animate={{ scale: [1, 1.1, 1] }}
           transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
           className="bg-wa-green hover:bg-wa-hover text-white rounded-full p-4 shadow-lg transition-colors"
         >
           <MessageCircle size={28} />
         </motion.div>
         <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-bg-dark text-text-on-dark text-xs font-sans font-semibold px-3 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
           {t('tooltip')}
         </span>
       </button>
     )
   }
   ```

5. Run `npx jest src/__tests__/Footer.test.tsx`, confirm it passes.

6. Commit: `"feat: migrate Footer and FloatingWA to next-intl translations"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/Footer.test.tsx` passes
- [ ] Footer renders via `getTranslations` (server-side), no `'use client'` directive added
- [ ] No placeholder/TODO comments in new code

---

### Phase 7: Migrate Layanan, Portfolio

**Estimated time:** 20 minutes

**Files:**
- Modify: `src/components/Layanan.tsx` (Server Component)
- Modify: `src/components/Portfolio.tsx` (Client Component)
- Modify: `src/__tests__/Layanan.test.tsx`, `src/__tests__/Portfolio.test.tsx`

**Steps:**

1. Read the current `src/__tests__/Layanan.test.tsx` and `Portfolio.test.tsx`
   content first (do not guess their assertions — inspect the actual files, since
   this plan was written without re-reading them verbatim). Adjust the rewritten
   versions below only if their existing assertions differ from what's assumed
   here (title text, service names).

2. Write failing test for Layanan as an async Server Component (same pattern as
   Phase 6 step 1):
   ```tsx
   import { render, screen } from '@testing-library/react'
   import { NextIntlClientProvider } from 'next-intl'
   import messages from '../messages/id.json'
   import Layanan from '@/components/Layanan'

   test('Layanan renders all 6 services with translated titles', async () => {
     const ui = await Layanan()
     render(
       <NextIntlClientProvider locale="id" messages={messages}>
         {ui}
       </NextIntlClientProvider>
     )
     expect(screen.getByText('Kitchen Set')).toBeInTheDocument()
     expect(screen.getByText('Interior Kantor')).toBeInTheDocument()
   })
   ```

3. Run it against current `Layanan.tsx`, confirm current behavior, then migrate.

4. Update `src/components/Layanan.tsx` to an async Server Component:
   ```tsx
   import { UtensilsCrossed, Package2, Tv2, Home, Building2, Hotel } from 'lucide-react'
   import type { LucideIcon } from 'lucide-react'
   import { getTranslations } from 'next-intl/server'

   interface Service {
     icon: LucideIcon
     title: string
     desc: string
     wide?: boolean
   }

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

   export default async function Layanan() {
     const t = await getTranslations('layanan')

     const services: Service[] = [
       { icon: UtensilsCrossed, title: t('kitchenSet.title'), desc: t('kitchenSet.desc') },
       { icon: Package2, title: t('lemariCustom.title'), desc: t('lemariCustom.desc') },
       { icon: Tv2, title: t('backdropTv.title'), desc: t('backdropTv.desc') },
       { icon: Hotel, title: t('hotelApartemen.title'), desc: t('hotelApartemen.desc'), wide: true },
       { icon: Home, title: t('renovasiRumah.title'), desc: t('renovasiRumah.desc') },
       { icon: Building2, title: t('interiorKantor.title'), desc: t('interiorKantor.desc') },
     ]

     return (
       <section id="layanan" className="bg-bg-section px-5 py-24 md:px-20">
         <div className="mx-auto max-w-7xl">
           <div className="mb-12 flex flex-col gap-3">
             <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
               {t('eyebrow')}
             </span>
             <h2 className="font-serif text-5xl font-bold text-bg-dark">{t('title')}</h2>
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
   ```

5. Run test, confirm it passes.

6. Write failing test for Portfolio (Client Component, uses `renderWithIntl`):
   ```tsx
   import { screen, fireEvent } from '@testing-library/react'
   import { renderWithIntl } from './test-utils'
   import Portfolio from '@/components/Portfolio'

   test('Portfolio renders translated project titles and opens lightbox', () => {
     renderWithIntl(<Portfolio />)
     expect(screen.getByText('Hasil Karya Kami')).toBeInTheDocument()
     fireEvent.click(screen.getByRole('button', { name: /kitchen set/i }))
     expect(screen.getByLabelText('Tutup')).toBeInTheDocument()
   })
   ```

7. Run it against current `Portfolio.tsx`, confirm current behavior, then migrate.

8. Update `src/components/Portfolio.tsx`:
   ```tsx
   'use client'
   import { useState, useEffect } from 'react'
   import { AnimatePresence, motion } from 'framer-motion'
   import Image from 'next/image'
   import { useTranslations } from 'next-intl'

   const projectKeys = [
     'kitchenSet', 'kamarTidur', 'ruangTamu', 'kantorModern', 'backdropTv',
     'retailBooth', 'lemariCustom', 'apartemen', 'renovasi',
   ] as const

   const projectImages: Record<(typeof projectKeys)[number], string> = {
     kitchenSet: '/images/portfolio/kitchen-set.jpg',
     kamarTidur: '/images/portfolio/bedroom.jpg',
     ruangTamu: '/images/portfolio/living-room.jpg',
     kantorModern: '/images/portfolio/office.jpg',
     backdropTv: '/images/portfolio/backdrop-tv.jpg',
     retailBooth: '/images/portfolio/retail-booth.jpg',
     lemariCustom: '/images/portfolio/lemari-custom.jpg',
     apartemen: '/images/portfolio/apartment.jpg',
     renovasi: '/images/portfolio/project.jpg',
   }

   export default function Portfolio() {
     const t = useTranslations('portfolio')
     const [selectedKey, setSelectedKey] = useState<(typeof projectKeys)[number] | null>(null)

     useEffect(() => {
       if (!selectedKey) return
       const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedKey(null) }
       window.addEventListener('keydown', onKey)
       return () => window.removeEventListener('keydown', onKey)
     }, [selectedKey])

     return (
       <section id="portfolio" className="bg-white px-5 py-24 md:px-20">
         <div className="mx-auto max-w-7xl">
           <div className="mb-12 flex flex-col items-center gap-3 text-center">
             <span className="font-sans font-semibold text-[11px] tracking-[1.32px] text-accent uppercase">
               {t('eyebrow')}
             </span>
             <h2 className="font-serif text-5xl font-bold text-bg-dark">{t('title')}</h2>
             <div className="h-0.5 w-12 bg-accent" />
           </div>

           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {projectKeys.map((key) => (
               <button
                 key={key}
                 onClick={() => setSelectedKey(key)}
                 className="relative h-64 overflow-hidden rounded-lg group text-left"
               >
                 <Image
                   src={projectImages[key]}
                   alt={t(`${key}.title`)}
                   fill
                   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                   className="object-cover transition-transform duration-500 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                   <div className="translate-y-4 transform text-center transition-transform duration-300 group-hover:translate-y-0">
                     <div className="flex items-center justify-center gap-2 mb-2">
                       <span className="h-px w-6 bg-[#c5a46c]" />
                       <span className="font-sans font-semibold text-[10px] tracking-[1.2px] text-[#c5a46c] uppercase">{t(`${key}.category`)}</span>
                       <span className="h-px w-6 bg-[#c5a46c]" />
                     </div>
                     <p className="font-serif italic text-2xl text-white">{t(`${key}.title`)}</p>
                   </div>
                 </div>
               </button>
             ))}
           </div>
         </div>

         <AnimatePresence>
           {selectedKey && (
             <motion.div
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedKey(null)}
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
                     src={projectImages[selectedKey]}
                     alt={t(`${selectedKey}.title`)}
                     fill
                     sizes="(max-width: 768px) 100vw, 80vw"
                     className="object-cover"
                     priority
                   />
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-12">
                   <span className="font-sans text-[10px] font-semibold tracking-[1.2px] text-[#c5a46c] uppercase">{t(`${selectedKey}.category`)}</span>
                   <p className="font-serif italic text-2xl text-white">{t(`${selectedKey}.title`)}</p>
                 </div>
                 <button
                   onClick={() => setSelectedKey(null)}
                   className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                   aria-label={t('close')}
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
   ```

9. Run both tests, confirm they pass.

10. Commit: `"feat: migrate Layanan and Portfolio to next-intl translations"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/Layanan.test.tsx src/__tests__/Portfolio.test.tsx` passes
- [ ] Layanan renders via `getTranslations` (server-side, still no `'use client'`)
- [ ] No placeholder/TODO comments in new code

---

### Phase 8: Migrate TentangKami, Testimoni, KlienKami

**Estimated time:** 20 minutes

**Files:**
- Modify: `src/components/TentangKami.tsx` (Client Component)
- Modify: `src/components/Testimoni.tsx` (Server Component)
- Modify: `src/components/KlienKami.tsx` (Server Component)
- Modify: `src/__tests__/TentangKami.test.tsx`, `src/__tests__/Testimoni.test.tsx`

**Steps:**

1. Read the current `src/__tests__/TentangKami.test.tsx` and
   `src/__tests__/Testimoni.test.tsx` content first. **Known issue:**
   `Testimoni.test.tsx` currently asserts `screen.getByText('Budi Santoso')`, which
   does not match the actual data (`Lamoist`, `Ibu Sari Dewi`, `PT Maju Bersama`) —
   this is a pre-existing bug unrelated to i18n (confirmed failing before this plan
   was written). While rewriting this test file for the Server Component + intl
   migration, fix the stale name assertion to match the real rendered content
   (`Lamoist`) — this is incidental to touching the file, not new scope.

2. Write failing test for TentangKami (Client Component):
   ```tsx
   import { screen } from '@testing-library/react'
   import { renderWithIntl } from './test-utils'
   import TentangKami from '@/components/TentangKami'

   test('TentangKami renders translated heading and stats', () => {
     renderWithIntl(<TentangKami />)
     expect(screen.getByText('Tentang Kionix Interior')).toBeInTheDocument()
     expect(screen.getByText('Proyek Selesai')).toBeInTheDocument()
   })
   ```

3. Run it against current `TentangKami.tsx`, confirm current behavior, then migrate.

4. Update `src/components/TentangKami.tsx` — replace hardcoded eyebrow/title/desc
   and stat labels with `useTranslations('tentang')`, keep the slideshow/stats
   array structure but source labels from `t()`:
   ```tsx
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
   const loop = [...slides, slides[0]]

   export default function TentangKami() {
     const t = useTranslations('tentang')
     const [current, setCurrent] = useState(0)
     const [animated, setAnimated] = useState(true)

     useEffect(() => {
       const timer = setInterval(() => setCurrent((c) => c + 1), 3500)
       return () => clearInterval(timer)
     }, [])

     useEffect(() => {
       if (current === slides.length) {
         const t2 = setTimeout(() => { setAnimated(false); setCurrent(0) }, 700)
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
   ```

5. Run test, confirm it passes.

6. Write failing/corrected test for Testimoni (Server Component):
   ```tsx
   import { render, screen } from '@testing-library/react'
   import { NextIntlClientProvider } from 'next-intl'
   import messages from '../messages/id.json'
   import Testimoni from '@/components/Testimoni'

   test('Testimoni renders 3 translated reviews', async () => {
     const ui = await Testimoni()
     render(
       <NextIntlClientProvider locale="id" messages={messages}>
         {ui}
       </NextIntlClientProvider>
     )
     expect(screen.getByText('Lamoist')).toBeInTheDocument()
     expect(screen.getByText('Ibu Sari Dewi')).toBeInTheDocument()
     expect(screen.getByText('PT Maju Bersama')).toBeInTheDocument()
   })
   ```

7. Update `src/components/Testimoni.tsx` to an async Server Component:
   ```tsx
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
   ```
   Customer names (`Lamoist`, `Ibu Sari Dewi`, `PT Maju Bersama`) stay as a plain
   TS record, not translation keys — proper nouns don't get translated.

8. Update `src/components/KlienKami.tsx` to an async Server Component:
   ```tsx
   import Image from 'next/image'
   import { getTranslations } from 'next-intl/server'

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
   ```

9. Run `npx jest src/__tests__/TentangKami.test.tsx src/__tests__/Testimoni.test.tsx`,
   confirm both pass.

10. Commit: `"feat: migrate TentangKami, Testimoni, KlienKami to next-intl translations; fix stale Testimoni test assertion"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/TentangKami.test.tsx src/__tests__/Testimoni.test.tsx` passes
- [ ] `Testimoni.test.tsx` no longer asserts the nonexistent `'Budi Santoso'`
- [ ] Testimoni and KlienKami render via `getTranslations` (server-side)
- [ ] No placeholder/TODO comments in new code

---

### Phase 9: Language switcher + per-locale SEO metadata

**Estimated time:** 20 minutes

**Files:**
- Create: `src/components/LocaleSwitcher.tsx` (Client Component)
- Modify: `src/components/Navbar.tsx` (add switcher)
- Modify: `src/app/[locale]/layout.tsx` (replace static `metadata` with `generateMetadata`)
- Test: `src/__tests__/LocaleSwitcher.test.tsx`

**Steps:**

1. Write failing test for the switcher. Expected error:
   `Cannot find module '@/components/LocaleSwitcher'`.
   ```tsx
   import { screen, fireEvent } from '@testing-library/react'
   import { renderWithIntl } from './test-utils'
   import LocaleSwitcher from '@/components/LocaleSwitcher'

   test('LocaleSwitcher renders all 3 language options', () => {
     renderWithIntl(<LocaleSwitcher />)
     expect(screen.getByText('Indonesia')).toBeInTheDocument()
     expect(screen.getByText('English')).toBeInTheDocument()
     expect(screen.getByText('中文')).toBeInTheDocument()
   })
   ```

2. Run it, confirm it fails (module not found).

3. Create `src/components/LocaleSwitcher.tsx`. Language names are conventionally
   shown in their own native language regardless of the active UI locale (a
   standard, widely-used UX pattern), so these 3 labels are NOT translation keys —
   hardcoded intentionally:
   ```tsx
   'use client'

   import { useState } from 'react'
   import { useLocale } from 'next-intl'
   import { usePathname } from '@/i18n/navigation'
   import Link from 'next/link'
   import { ChevronDown } from 'lucide-react'

   const options = [
     { code: 'id', label: 'Indonesia' },
     { code: 'en', label: 'English' },
     { code: 'zh', label: '中文' },
   ] as const

   export default function LocaleSwitcher() {
     const locale = useLocale()
     const pathname = usePathname()
     const [open, setOpen] = useState(false)
     const current = options.find((o) => o.code === locale) ?? options[0]

     return (
       <div className="relative">
         <button
           type="button"
           onClick={() => setOpen(!open)}
           className="flex items-center gap-1 font-sans font-semibold text-xs tracking-widest text-bg-dark hover:text-accent transition-colors"
         >
           {current.label}
           <ChevronDown size={14} />
         </button>
         {open && (
           <div className="absolute right-0 top-full mt-2 w-32 rounded border border-border bg-white shadow-md">
             {options.map((o) => (
               <Link
                 key={o.code}
                 href={pathname}
                 locale={o.code}
                 onClick={() => setOpen(false)}
                 className={`block px-4 py-2 font-sans text-xs ${
                   o.code === locale ? 'font-bold text-accent' : 'text-bg-dark hover:text-accent'
                 }`}
               >
                 {o.label}
               </Link>
             ))}
           </div>
         )}
       </div>
     )
   }
   ```
   `usePathname()`/`Link` come from `@/i18n/navigation` (created in Phase 1) —
   these are next-intl's locale-aware wrappers, so switching locale preserves
   the current page path (e.g. staying on `/en` → `/zh`, not bouncing to home).

4. Add `<LocaleSwitcher />` to `src/components/Navbar.tsx` — place it next to the
   desktop CTA button and inside the mobile menu, reusing existing navbar
   spacing/layout (no new visual design needed, per earlier decision):
   ```tsx
   import LocaleSwitcher from '@/components/LocaleSwitcher'
   // ...
   <div className="hidden md:flex items-center gap-6">
     <LocaleSwitcher />
     <button type="button" onClick={() => openWaModal('navbar-desktop')} className="...">
       {t('cta')}
     </button>
   </div>
   ```
   (Wrap the existing desktop CTA button in this flex container alongside the
   switcher; mobile menu gets `<LocaleSwitcher />` added as its own `<li>` above
   the CTA button.)

5. Run `npx jest src/__tests__/LocaleSwitcher.test.tsx src/__tests__/Navbar.test.tsx`,
   confirm both pass.

6. Replace the static `metadata` export in `src/app/[locale]/layout.tsx` with
   `generateMetadata` sourced from `seo.*` translation keys, plus `alternates.languages`
   for hreflang:
   ```tsx
   import type { Metadata } from "next";
   import { getTranslations } from 'next-intl/server';

   const ogImage = "/og-image.jpg";

   export async function generateMetadata({
     params,
   }: {
     params: Promise<{ locale: string }>;
   }): Promise<Metadata> {
     const { locale } = await params;
     const t = await getTranslations({ locale, namespace: 'seo' });
     const title = t('title');
     const description = t('description');

     return {
       metadataBase: new URL("https://kionixinterior.com"),
       title,
       description,
       keywords: t.raw('keywords') as string[],
       alternates: {
         languages: {
           id: 'https://kionixinterior.com',
           en: 'https://kionixinterior.com/en',
           zh: 'https://kionixinterior.com/zh',
         },
       },
       openGraph: {
         title,
         description,
         url: locale === 'id' ? 'https://kionixinterior.com' : `https://kionixinterior.com/${locale}`,
         siteName: "Kionix Interior",
         images: [{ url: ogImage, width: 1200, height: 630 }],
         locale: locale === 'id' ? 'id_ID' : locale === 'zh' ? 'zh_CN' : 'en_US',
         type: "website",
       },
       twitter: {
         card: "summary_large_image",
         title,
         description,
         images: [ogImage],
       },
     };
   }
   ```
   Remove the old hardcoded `export const metadata: Metadata = {...}` block from
   this file — `generateMetadata` replaces it entirely.

7. Run `npx next build`, confirm it succeeds and all 3 locale routes generate
   metadata without errors.

8. Commit: `"feat: add language switcher and per-locale SEO metadata"`

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `npx jest src/__tests__/LocaleSwitcher.test.tsx src/__tests__/Navbar.test.tsx` passes
- [ ] `npx next build` succeeds
- [ ] No placeholder/TODO comments in new code
- [ ] Manual check (Phase 10 covers full curl verification): each locale's `<title>`
  and `<meta name="description">` differ appropriately

---

### Phase 10: Full verification, deploy, and manual QA

**Estimated time:** 25 minutes

**Files:** none (verification-only phase)

**Steps:**

1. Run full test suite: `npx jest`. Confirm all tests pass (no lingering
   `Testimoni.test.tsx` failure — fixed in Phase 8).

2. Run `npx tsc --noEmit`. Confirm zero errors.

3. Run `npx next build`. Confirm success and inspect the route output — expect
   to see `/[locale]` listed as a route, plus `/api/wa-click`, `/icon.png` at the
   root level (unaffected by the locale segment).

4. Start the app locally (`npm run start` after build, or `npm run dev`) and
   manually verify via `curl`:
   ```
   curl -sI http://localhost:3000/          # expect 200, Indonesian content
   curl -sI http://localhost:3000/en        # expect 200, English content
   curl -sI http://localhost:3000/zh        # expect 200, Chinese content
   curl -s http://localhost:3000/en | grep '<html lang='   # expect lang="en"
   curl -s http://localhost:3000/zh | grep '<html lang='   # expect lang="zh"
   curl -s http://localhost:3000/api/wa-click -X POST -H "Content-Type: application/json" -d '{"source":"test","name":"Test","phone":"08123"}'   # expect {"ok":true} — confirms API route still works, locale-agnostic
   ```

5. Manually test in a browser: load `/`, click the language switcher, confirm it
   navigates to `/en` and `/zh` correctly, and back. Confirm Mandarin text renders
   with the Noto Sans SC font (not tofu/boxes) — visually inspect the `/zh` page.

6. Manually test the WhatsApp lead modal on all 3 locales: click any WA CTA on
   `/en`, confirm the modal shows English labels, submit with a test name, confirm
   the resulting `wa.me` URL's `text` param reads
   `Hello Kionix, I'm <name>, I'd like a consultation`. Repeat for `/zh`.

7. Commit any final fixes if manual QA surfaces issues (should be none if all
   prior phase verifications passed).

8. Deploy to VPS following the established process from prior sessions:
   ```
   git push
   ```
   then on the VPS (`root@187.77.126.170`, path `/opt/kionixinterior-web`):
   ```
   git pull && docker compose -f docker-compose.prod.yml up -d --build
   ```

9. Verify production after deploy:
   ```
   curl -sI https://kionixinterior.com --max-time 15
   curl -sI https://kionixinterior.com/en --max-time 15
   curl -sI https://kionixinterior.com/zh --max-time 15
   ```
   All 3 should return `HTTP 200`.

**Verification:**
- [ ] `npx jest` — all tests pass, zero failures
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx next build` — succeeds
- [ ] All 3 locale routes return HTTP 200 locally and in production
- [ ] `/api/wa-click` still works (unaffected by locale routing)
- [ ] Mandarin renders with correct font (no tofu boxes)
- [ ] WhatsApp prefill message is correctly localized per active locale
- [ ] No placeholder/TODO comments anywhere in the diff

---

## Execution Handoff

Ready to start Phase 1? I'll use `gaspol-execute` to implement with per-phase
checkpoints, or `gaspol-parallel` isn't a good fit here — phases are sequential
(each builds on the previous: routing → messages → restructure → component
migrations → switcher/SEO → deploy), not independent.
