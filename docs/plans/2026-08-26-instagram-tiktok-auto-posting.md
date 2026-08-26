# Instagram & TikTok auto-posting untuk artikel

> **For Claude:** REQUIRED SKILL: Use gaspol-execute to implement this plan.
> **CRITICAL:** This plan specifies real integrations (Zernio API, real connected
> Instagram/TikTok accounts). During execution, NEVER substitute placeholders for
> real data sources without explicit user approval. If a data source doesn't exist
> yet, STOP and ask.
> **Progress ledger — HARD PER-PHASE GATE:** `.gaspol/progress/instagram-tiktok-auto-posting.md`.
> After EACH phase and BEFORE starting the next, STOP and append that phase's line —
> status `done` + the exact command run and its result. Never batch updates at the end.
> **Self-contained:** this plan is the COMPLETE spec — every file path, API contract,
> account ID, and convention it needs is written here verbatim. See especially the
> "Kontrak API Zernio" section below (real, already-validated account IDs and request
> shape) and the Implementation Plan's Data Integration Map.
> **LIVE-POSTING WARNING:** `POST /v1/posts` with `publishNow: true` immediately
> publishes to the real, connected Kionix Instagram (`kionixinterior`) and TikTok
> (`kionixinterior`) business accounts — there is no draft/undo for a published social
> post. Phase 7's manual verification step deliberately posts about ONE real article
> end-to-end so this gets a human look before the cron job runs unattended on
> everything. Never loop live-posting calls in an automated test.

## Design

### Masalah & Tujuan

Setiap artikel yang dipublish (via `daily-article.js`, jalan 2x/hari otomatis) juga harus
otomatis diposting ke Instagram dan TikTok Kionix, dalam format carousel, dengan caption
singkat yang digenerate dari artikel — tanpa campur tangan manual.

### Keputusan yang sudah diambil (lewat brainstorm)

1. **Platform integrasi: Zernio** (unified social API, https://zernio.com) — bukan native
   Meta Graph API / TikTok Content Posting API langsung. Free tier: 2 akun sosial,
   posting unlimited, tanpa kartu kredit — cukup buat IG + TikTok Kionix. Auth via OAuth
   (connect akun sekali di dashboard Zernio), jauh lebih cepat live dibanding app-review
   Meta/TikTok.
2. **Koreksi setelah riset lebih dalam (llms.txt + OpenAPI spec resmi Zernio,
   bukan cuma halaman docs umum):** TikTok **DUKUNG photo carousel** juga, lewat
   `tiktokSettings.media_type: "photo"` (maks 35 gambar; Instagram carousel maks 10
   gambar, tidak boleh campur foto+video). Jadi **tidak perlu render video/ffmpeg sama
   sekali** — kedua platform pakai slide gambar yang identik, cuma beda `platforms[].platformSpecificData`/`tiktokSettings` di request.
   - **Keputusan final:** Instagram & TikTok sama-sama posting sebagai photo carousel,
     1 kali API call per artikel (`platforms` array berisi keduanya).
   - Cap jumlah slide per post: **7 slide tetap** (1 cover + 5 poin isi + 1 CTA),
     berapa pun jumlah section artikelnya — aman di bawah limit kedua platform, dan
     lebih enak dibaca daripada carousel 10 slide.
3. **Isi tiap slide:** reuse gambar yang sudah ada (cover + gambar per-section, hasil
   generate snapgen dari `daily-article.js`/`generate-article-images.js`) + teks overlay
   di atasnya — bukan generate gambar baru dari nol.
4. **Cakupan:** backfill 6 artikel `published` yang sudah ada sekarang, DAN semua artikel
   baru ke depannya.
5. **Caption:** hook 1 kalimat (dari `quickAnswer`) + 2-3 poin singkat + CTA WhatsApp +
   hashtag lokal singkat. Bukan ringkasan netral, bukan caption panjang ala blog.

### Arsitektur

Script terpisah, **decoupled** dari `daily-article.js`:

- **Kenapa terpisah:** (a) backfill 6 artikel lama butuh script yang jalan independen
  dari alur generate-artikel; (b) kegagalan posting ke Zernio (limit/down) tidak boleh
  menggagalkan publish artikel di website — dua failure domain yang berbeda.
- **State tracking:** kolom baru `articles.social_posted_at` (nullable timestamp).
  `NULL` = belum diposting (termasuk otomatis mencakup 6 artikel lama). Migration lewat
  `npm run db:generate` + `db:migrate` seperti biasa (Drizzle).
- **Script:** `scripts/social-post.js` (CJS, pola sama seperti `daily-article.js`) —
  1. Query artikel `status='published' AND social_posted_at IS NULL`, urut terlama dulu.
  2. Ambil cover + gambar section dari `article_translations.body` (locale `id`) +
     `quick_answer` buat caption.
  3. Composite tiap slide: gambar + teks overlay pakai **`sharp`** (baru — belum ada
     library image-compositing di project). Simpan ke `public/uploads/` (pola sama
     seperti `persistImageLocally`), diakses via route `/uploads/[...path]` yang sudah
     ada.
  4. Build caption dari template (hook + poin + CTA + hashtag).
  5. Satu `POST /v1/posts` ke Zernio dengan `mediaItems` (7 slide, image URL publik
     `https://kionixinterior.com/uploads/...`) dan `platforms: [instagram, tiktok]`
     sekaligus + `tiktokSettings` (privacy_level, allow_comment/duet/stitch, media_type:
     "photo"). Detail kontrak persis di bawah.
  6. `update articles set social_posted_at = now() where id = ...` — hanya setelah
     API call Zernio sukses (HTTP 2xx); kalau gagal, tidak ditandai, supaya di-retry
     run berikutnya.
- **Cron:** baris baru di crontab stage `cron`, dijalankan beberapa menit setelah
  `daily-article.js` di slot yang sama (`15 6,16 * * *`) — kasih jeda supaya artikel +
  gambar barunya sudah pasti commit duluan.

### Desain visual slide

Reuse token brand yang sudah ada di CLAUDE.md (`accent #26A1B0`, `bg-dark #0C1A1D`,
font-serif Cormorant Garamond, font-sans Plus Jakarta Sans) — bukan eksplorasi palet baru.

Format **1080×1350 (4:5 portrait)**.

- **Slide 1 (hook):** cover artikel sebagai background, gradient gelap dari bawah, judul
  artikel (font-serif, putih, besar) di sepertiga bawah, wordmark "Kionix" kecil pojok
  kiri atas.
- **Slide 2..N-1 (poin isi):** gambar per-section sebagai background + scrim gelap tipis,
  1 poin singkat per slide (font-sans bold, putih), indikator halaman ("2/5") pojok kanan
  bawah, garis aksen `accent` di bawah teks.
- **Slide terakhir (CTA):** background solid `bg-dark`, tanpa foto, headline "Konsultasi
  Gratis", nomor WhatsApp, tagline singkat.
- Slide yang sama persis dipakai untuk Instagram (carousel foto) dan TikTok (photo
  carousel) — tidak ada versi video terpisah.

### Kontrak API Zernio (verbatim, sudah divalidasi live)

**Base URL:** `https://zernio.com/api/v1`
**Auth header:** `Authorization: Bearer $ZERNIO_API_KEY` (key sudah tersimpan di
`.env.local`, key sudah divalidasi hidup lewat `GET /v1/profiles` — berhasil)

**Akun yang sudah connect (real, dari `GET /v1/accounts?profileId=...`):**
- `profileId`: `6a8ee5110a22a0bf10cac5e6`
- Instagram `accountId`: `6a8f0e2c77555aae01b41e37` (username `kionixinterior`, permission `instagram_business_content_publish` aktif)
- TikTok `accountId`: `6a8f0f6177555aae01b4ed87` (username `kionixinterior`, `canPostMore: true`)
- TikTok `privacy_level` valid (dari `GET /v1/accounts/6a8f0f6177555aae01b4ed87/tiktok/creator-info`): `PUBLIC_TO_EVERYONE`

**Request buat tiap artikel — `POST /v1/posts`:**
```json
{
  "content": "<caption hasil template>",
  "publishNow": true,
  "timezone": "Asia/Jakarta",
  "profileId": "6a8ee5110a22a0bf10cac5e6",
  "platforms": [
    { "platform": "instagram", "accountId": "6a8f0e2c77555aae01b41e37" },
    { "platform": "tiktok", "accountId": "6a8f0f6177555aae01b4ed87" }
  ],
  "mediaItems": [
    { "type": "image", "url": "https://kionixinterior.com/uploads/<slide-1>.jpg" },
    { "type": "image", "url": "https://kionixinterior.com/uploads/<slide-2>.jpg" }
  ],
  "tiktokSettings": {
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "allow_comment": true,
    "allow_duet": true,
    "allow_stitch": true,
    "commercial_content_type": "none",
    "content_preview_confirmed": true,
    "express_consent_given": true,
    "media_type": "photo"
  }
}
```
- Sukses: HTTP 2xx, body berisi `post` dengan `_id` dan status per-platform.
- Instagram carousel: otomatis terbentuk kalau `mediaItems` berisi >1 item bertipe `image` (maks 10 — kita kirim 7, aman).
- TikTok photo carousel: `tiktokSettings.media_type: "photo"` + `mediaItems` image yang sama (maks 35 — 7 aman).
- Constraint penting: **jangan campur `image` dan `video`** dalam satu `mediaItems` (berlaku utk kedua platform) — di plan ini semua item selalu `type: "image"`, jadi aman by construction.

### Caption template

```
{hook kalimat dari quickAnswer}

✨ {poin 1}
✨ {poin 2}
✨ {poin 3}

Mau konsultasi gratis interior rumah/kantor di Batam? Chat kami via WhatsApp (link di bio) 📲

#interiorbatam #desaininteriorbatam #kionixinterior #renovasirumahbatam
```

### Data Integration Map

| Component | Data Source | Existing? | Notes |
|---|---|---|---|
| Cover + section images | `articles.cover_image_url`, image URL di `article_translations.body` | ✅ | sudah digenerate `daily-article.js` |
| Caption hook | `article_translations.quick_answer` (locale `id`) | ✅ | |
| Caption poin | heading/isi tiap `## ` section di body | ✅ | ekstraksi ringan dari markdown |
| Social-post tracking | `articles.social_posted_at` | ❌ baru | kolom nullable, migration Drizzle |
| Slide compositing | `sharp` (npm) | ❌ baru | overlay teks di atas gambar |
| Posting | Zernio API (`POST /v1/posts`) | ✅ akun sudah connect | account IDs & contract di atas, sudah divalidasi live |

### Blocker sebelum implementasi bisa mulai

~~Kamu perlu bikin akun Zernio dan connect IG/TikTok~~ — **sudah selesai.** API key sudah
divalidasi (`GET /v1/profiles` sukses), kedua akun (Instagram + TikTok) sudah connect dan
aktif. `ZERNIO_API_KEY` sudah tersimpan di `.env.local` (gitignored). Yang masih perlu
dikerjakan manual sebelum production deploy: tambahkan `ZERNIO_API_KEY` yang sama ke
`docker-compose.prod.yml` di VPS (pola sama seperti `SNAPGEN_API_KEY`/`FIRECRAWL_API_KEY`),
karena file itu gitignored dan tidak ikut ter-deploy lewat `git pull`.

### Yang sengaja di-skip (v1)

- Analytics/tracking hasil post (likes, reach) — bukan bagian dari scope ini.
- Retry backoff canggih (exponential backoff dll) — cukup "coba lagi cron berikutnya"
  karena frekuensi udah 2x/hari.
- **Per-platform retry** (kalau Instagram sukses tapi TikTok gagal, coba ulang TikTok
  saja tanpa nge-duplikat Instagram) — `social_posted_at` cuma 1 kolom per artikel,
  bukan per-platform. Ditemukan real di post live pertama (2026-08-26): TikTok gagal
  dengan `"direct posting is at capacity"` (rate limit dari sisi TikTok, bukan bug kita),
  Instagram tetap sukses independen. Diputuskan: biarkan cron 2x/hari jalan natural,
  revisit per-platform retry cuma kalau TikTok terus-menerus gagal.

## Implementation Plan

### Goal

Setiap artikel `published` (baru maupun 6 yang sudah ada) otomatis diposting sebagai
photo carousel ke Instagram + TikTok Kionix lewat Zernio API, dengan caption singkat
yang digenerate dari artikel — dijalankan lewat cron, tanpa campur tangan manual.

### Architecture Context

- **DB** (`src/lib/db/schema.ts`, Drizzle/Postgres): `articles` table punya
  `coverImageUrl`, `status`, dll — perlu 1 kolom baru `social_posted_at` (nullable
  timestamp). `article_translations.body` (locale `id`) berisi markdown dengan gambar
  section sudah disisipkan sebagai `![heading](/uploads/xxx.jpg)`.
- **Section parsing sudah ada:** `src/lib/images/sections.ts` — `splitSections(body)`
  mengembalikan `{ heading, content, raw, start, hasImage }[]`. Untuk fitur ini kita
  butuh section yang **`hasImage === true`** (kebalikan dari `qualifyingSections`, yang
  ambil section TANPA gambar — itu dipakai buat generate gambar baru, bukan buat kita).
- **Image persistence sudah ada:** `src/lib/images/storage.ts` —
  `persistImageLocally(sourceUrl, fetchImpl?)` — download URL manapun (termasuk buffer
  lokal yang di-upload ulang) dan simpan ke `public/uploads/<uuid>.<ext>`, return
  `/uploads/...`. Reuse persis fungsi ini buat menyimpan slide hasil composite (submit
  sebagai data URL atau lewat variant baru yang terima Buffer langsung — lihat Phase 4).
- **Constants sudah ada:** `src/lib/constants.ts` — `WHATSAPP_NUMBER = '6281372703589'`,
  `COMPANY_NAME = 'Kionix Interior'`.
- **Design tokens** (`tailwind.config.ts`): `accent #26A1B0`, `bg-dark #0C1A1D`,
  `text-on-dark #FFFFFF`. Font files: `Cormorant Garamond` (headings) dan
  `Plus Jakarta Sans` (body) — dipakai via Google Fonts `@next/font` di app; untuk
  compositing gambar server-side (di luar Next render, jadi tidak bisa pakai
  `next/font`), font harus di-load sebagai file `.ttf` statis — lihat Phase 4.
- **Cron pattern sudah ada:** `scripts/daily-article.js` + `Dockerfile`'s `cron` stage
  (crontab `0 6,16 * * * cd /app && node scripts/daily-article.js ...`). Script baru ini
  ikut pola CJS yang sama (plain `require`, tidak import dari `src/`, per divergensi yang
  sudah didokumentasikan di CLAUDE.md untuk semua script `scripts/*.js`).
- **Kontrak API Zernio** — lihat section "Kontrak API Zernio" di atas (Design) untuk
  account IDs, endpoint, dan request shape verbatim yang sudah divalidasi live.

### Tech Stack

- **Baru:** `sharp` (npm, image compositing — overlay teks di atas gambar, resize ke
  1080×1350). Dependency populer, native binding, sudah luas dipakai di ekosistem
  Next.js (Next sendiri optional-dependency `sharp` buat image optimization).
- **Tidak ada dependency lain yang baru** — tidak butuh ffmpeg (lihat koreksi di atas),
  tidak butuh library HTTP baru (`fetch` native, sama seperti `snapgen.ts`).

### Data Integration Map

| Feature | Data Source | Hook/API | Exists? | Action |
|---|---|---|---|---|
| Artikel yang perlu diposting | `articles` (status, social_posted_at) | Drizzle query langsung di `scripts/social-post.js` | Sebagian (kolom baru) | Tambah kolom, tulis query |
| Gambar cover + section | `articles.coverImageUrl`, `article_translations.body` | `splitSections()` dari `src/lib/images/sections.ts` | Ya | Reuse langsung |
| Caption hook | `article_translations.quickAnswer` | — | Ya | Reuse langsung |
| Nomor WA / nama brand | `src/lib/constants.ts` | `WHATSAPP_NUMBER`, `COMPANY_NAME` | Ya | Reuse langsung |
| Slide compositing | `sharp` | `src/lib/social/slideImage.ts` (baru) | Tidak | Buat baru, real (bukan placeholder) |
| CTA slide statis | 1 file gambar pre-render | `public/social/cta-slide.jpg` (baru) | Tidak | Generate sekali, commit sebagai asset |
| Posting ke Zernio | Zernio API `POST /v1/posts` | `src/lib/social/zernio.ts` (baru) | Akun sudah connect, endpoint sudah divalidasi | Buat client baru, real (bukan mock) |
| API key | `.env.local` `ZERNIO_API_KEY` | `process.env.ZERNIO_API_KEY` | Ya (sudah tersimpan) | Reuse, tambahkan ke `docker-compose.prod.yml` saat deploy |

---

### Phase 1: Kolom DB + eligibility check

**Estimated time:** 10 menit

**Files:**
- Modify: `src/lib/db/schema.ts` (tambah kolom `socialPostedAt`)
- Create: `src/lib/social/eligibility.ts`
- Test: `src/__tests__/socialEligibility.test.ts`
- Migration: file baru di `./drizzle` (hasil `npm run db:generate`)

**Steps:**
1. Write failing test for `needsSocialPost({status: 'published', socialPostedAt: null})` returning `true`, dan `false` untuk `status !== 'published'` atau `socialPostedAt` bukan `null`. Expected error: `Cannot find module '@/lib/social/eligibility'`.
2. Run test, confirm gagal karena module belum ada.
3. Di `src/lib/db/schema.ts`, tambah `socialPostedAt: timestamp('social_posted_at', { withTimezone: true })` (nullable, tanpa default) ke `articles` table.
4. Buat `src/lib/social/eligibility.ts`:
   ```ts
   export function needsSocialPost(article: { status: string; socialPostedAt: Date | null }): boolean {
     return article.status === 'published' && article.socialPostedAt === null
   }
   ```
5. Run test, confirm pass.
6. Run `npm run db:generate` (bikin migration file), lalu `npm run db:migrate` (apply ke dev DB lokal).
7. Commit: "feat: add social_posted_at column + needsSocialPost eligibility check"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest socialEligibility` passes, mencakup kasus published+null (true), published+non-null (false), draft/in_review (false)
- [ ] Migration file baru muncul di `./drizzle`, `npm run db:migrate` sukses tanpa error di dev DB lokal
- [ ] No placeholder/TODO comments

---

### Phase 2: Caption builder

**Estimated time:** 10 menit

**Files:**
- Create: `src/lib/social/caption.ts`
- Test: `src/__tests__/socialCaption.test.ts`

**Steps:**
1. Write failing test: `buildCaption({ hook: 'Kenapa nuansa hangat jadi tren?', points: ['Poin A', 'Poin B'], waNumber: '6281372703589' })` menghasilkan string yang mengandung hook di baris pertama, tiap poin diawali `✨ `, baris CTA persis `Mau konsultasi gratis interior rumah/kantor di Batam? Chat kami via WhatsApp (link di bio) 📲`, dan diakhiri hashtag `#interiorbatam #desaininteriorbatam #kionixinterior #renovasirumahbatam`. Expected error: `Cannot find module '@/lib/social/caption'`.
2. Run test, confirm gagal.
3. Implement `buildCaption` sesuai template di atas (persis, termasuk emoji dan urutan baris). Cap `points` ke maksimal 3 (`.slice(0, 3)`) — kalau lebih dari 3 dikasih, diam-diam dipotong (bukan error), karena caption tetap harus singkat.
4. Run test, confirm pass.
5. Commit: "feat: add buildCaption for social posts"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] Test mencakup: 1 poin, 3 poin, >3 poin (dipotong ke 3), `waNumber` muncul benar di CTA (kalau CTA memang mengandung nomor — cek ulang template: CTA saat ini generik "link di bio", tanpa nomor eksplisit; kalau eksekutor mau tambahkan nomor literal di caption, tambahkan test utk itu juga)
- [ ] No placeholder/TODO comments

---

### Phase 3: Slide plan (pilih gambar + teks overlay per slide)

**Estimated time:** 15 menit

**Files:**
- Create: `src/lib/social/slidePlan.ts`
- Test: `src/__tests__/socialSlidePlan.test.ts`

**Steps:**
1. Write failing test: `buildSlidePlan({ title: 'Judul Artikel', coverImageUrl: '/uploads/cover.jpg', body: '<markdown dengan 3 section ber-gambar>' })` mengembalikan array dengan slide pertama `{ kind: 'cover', imageUrl: '/uploads/cover.jpg', text: 'Judul Artikel' }`, diikuti maksimal 5 slide `{ kind: 'point', imageUrl, text: heading }` dari section yang **punya gambar** (`hasImage === true`, pakai `splitSections` dari `src/lib/images/sections.ts`), urut sesuai posisi di body. Expected error: `Cannot find module '@/lib/social/slidePlan'`.
2. Run test, confirm gagal.
3. Implement `buildSlidePlan`:
   ```ts
   import { splitSections } from '@/lib/images/sections'

   const IMAGE_URL_RE = /!\[[^\]]*\]\(([^)]*)\)/
   const MAX_POINT_SLIDES = 5

   export type Slide = { kind: 'cover' | 'point'; imageUrl: string; text: string }

   export function buildSlidePlan(article: { title: string; coverImageUrl: string; body: string }): Slide[] {
     const pointSlides = splitSections(article.body)
       .filter((s) => s.hasImage)
       .slice(0, MAX_POINT_SLIDES)
       .map((s) => ({ kind: 'point' as const, imageUrl: s.content.match(IMAGE_URL_RE)?.[1] ?? '', text: s.heading }))
       .filter((s) => s.imageUrl !== '')
     return [{ kind: 'cover', imageUrl: article.coverImageUrl, text: article.title }, ...pointSlides]
   }
   ```
4. Run test, confirm pass.
5. Tambah test kasus: artikel dengan 0 section ber-gambar → hasil cuma 1 slide (cover saja); artikel dengan >5 section ber-gambar → dipotong ke 5.
6. Commit: "feat: add buildSlidePlan for social carousel slides"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] Test mencakup: 0, 3, dan >5 section ber-gambar
- [ ] Total slide dari fungsi ini selalu ≤ 6 (1 cover + maks 5 poin) — CTA slide statis ditambahkan terpisah di Phase 6/7, BUKAN oleh fungsi ini
- [ ] No placeholder/TODO comments

---

### Phase 4: Slide image compositing (teks overlay pakai sharp)

**Estimated time:** 20 menit

**Files:**
- Modify: `package.json` (tambah `sharp`)
- Create: `src/lib/social/slideImage.ts`
- Test: `src/__tests__/socialSlideImage.test.ts`

**Steps:**
1. `npm install sharp`
2. Write failing test: `compositeSlideImage({ imageBuffer, text, variant: 'cover' | 'point' })` mengembalikan `Buffer` JPEG berukuran 1080×1350 (cek via `sharp(result).metadata()` → `width === 1080 && height === 1350`). Expected error: `Cannot find module '@/lib/social/slideImage'`.
3. Run test, confirm gagal.
4. Implement `compositeSlideImage` di `src/lib/social/slideImage.ts`:
   - Resize/crop `imageBuffer` ke cover 1080×1350 (`sharp(imageBuffer).resize(1080, 1350, { fit: 'cover' })`).
   - Bikin overlay SVG (gradient gelap dari bawah + teks) pakai `sharp` composite dengan SVG string (font-family fallback ke sans-serif generik — sharp/librsvg tidak otomatis punya akses ke Google Fonts, jadi **jangan** rely on `Cormorant`/`Plus Jakarta Sans` di sini kecuali font file `.ttf`-nya di-embed manual sebagai `@font-face` base64 di dalam SVG. Kalau mau tetap pakai font asli, download `.ttf` Cormorant Garamond + Plus Jakarta Sans dari Google Fonts sekali, taruh di `src/lib/social/fonts/`, embed sebagai base64 di SVG. Kalau mau simpel: skip font asli, pakai `sans-serif` bold generik untuk v1 — ponytail: font generik dulu, upgrade ke font asli kalau brand konsistensi di social jadi masalah nyata).
   - Beda styling dikit per `variant`: `cover` = teks besar font-serif-style di sepertiga bawah; `point` = teks lebih kecil + garis aksen `#26A1B0` di bawahnya.
   - Return `Buffer` (`.jpeg({ quality: 85 })`).
5. Run test, confirm pass.
6. Commit: "feat: add compositeSlideImage (sharp text overlay)"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] Test memverifikasi dimensi output PERSIS 1080×1350 dan format JPEG valid (`sharp` bisa re-parse hasilnya tanpa error)
- [ ] Coba render 1 slide manual (script kecil sekali-pakai atau lewat test) dan buka file-nya — pastikan teks kebaca, tidak terpotong, tidak overlap sama gambar terang
- [ ] No placeholder/TODO comments

---

### Phase 5: CTA slide statis (asset, bukan kode)

**Estimated time:** 10 menit

**Files:**
- Create: `public/social/cta-slide.jpg` (asset, bukan kode — di-commit ke git, BUKAN ke `public/uploads/` yang gitignored-runtime-content)

**Steps:**
1. Pakai `compositeSlideImage` dari Phase 4 (lewat skrip sekali-pakai, dijalankan manual, dibuang setelah selesai — pola sama seperti skrip one-off lain di project ini) untuk generate 1 gambar solid `bg-dark (#0C1A1D)` + teks "Konsultasi Gratis" + `WHATSAPP_NUMBER` (dari `src/lib/constants.ts`) + tagline `COMPANY_TAGLINE`.
2. Simpan hasilnya ke `public/social/cta-slide.jpg`, commit sebagai asset statis (dipakai identik di SETIAP post — tidak digenerate ulang per artikel).
3. Commit: "chore: add static CTA slide asset for social posts"

**Verification:**
- [ ] File `public/social/cta-slide.jpg` ada, ukuran 1080×1350, teks kebaca jelas
- [ ] Bukan kode — tidak ada test unit untuk asset statis ini

---

### Phase 6: Zernio client (payload builder + HTTP call)

**Estimated time:** 20 menit

**Files:**
- Create: `src/lib/social/zernio.ts`
- Test: `src/__tests__/socialZernioClient.test.ts`

**Steps:**
1. Write failing test untuk `buildZernioPayload({ caption, imageUrls, profileId, igAccountId, tiktokAccountId, tiktokPrivacyLevel })` — assert hasil PERSIS sama dengan shape di section "Kontrak API Zernio" (Design, di atas): `content`, `publishNow: true`, `timezone: 'Asia/Jakarta'`, `profileId`, `platforms` (instagram + tiktok dengan accountId masing-masing), `mediaItems` (tiap `imageUrls[i]` jadi `{ type: 'image', url: imageUrls[i] }`), `tiktokSettings` (persis 8 field yang didokumentasikan, termasuk `media_type: 'photo'`). Expected error: `Cannot find module '@/lib/social/zernio'`.
2. Run test, confirm gagal.
3. Implement `buildZernioPayload` — pure function, hardcode field `tiktokSettings` sesuai kontrak (jangan generalisasi berlebihan, ini API eksternal spesifik).
4. Run test, confirm pass untuk payload builder.
5. Write failing test kedua untuk `postToZernio(apiKey, payload)` — mock `global.fetch` (pola identik `src/__tests__/snapgenClient.test.ts`): sukses (200, return `{ post: { _id: '...' } }`) → resolve dengan post id; gagal (4xx/5xx) → reject dengan error yang menyertakan status code + body error message dari response.
6. Implement `postToZernio`:
   ```ts
   export async function postToZernio(apiKey: string, payload: unknown, fetchImpl: typeof fetch = fetch) {
     const res = await fetchImpl('https://zernio.com/api/v1/posts', {
       method: 'POST',
       headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
       body: JSON.stringify(payload),
     })
     if (!res.ok) throw new Error(`Zernio post failed: ${res.status} ${await res.text()}`)
     return res.json()
   }
   ```
7. Run test, confirm pass.
8. Commit: "feat: add Zernio client (payload builder + postToZernio)"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `buildZernioPayload` test asserts EXACT shape (bukan cuma "punya field X") — locks in kontrak biar typo tidak lolos ke production
- [ ] `postToZernio` test mencakup sukses dan gagal (mocked fetch, TIDAK memanggil API asli di test)
- [ ] No placeholder/TODO comments
- [ ] **Security check:** `apiKey` tidak pernah di-log (`console.log`) di mana pun dalam module ini; error message dari Zernio di-throw apa adanya (tidak echo `apiKey`)

---

### Phase 7: Script cron `scripts/social-post.js` + verifikasi manual end-to-end (LIVE)

**Estimated time:** 30 menit

**Files:**
- Create: `scripts/social-post.js` (CJS, duplikasi logic dari Phase 1-6 secara inline —
  pola sama seperti `scripts/daily-article.js`/`scripts/generate-article-images.js`,
  karena script ini plain `node`, tidak bisa `require()` module TS langsung)

**Steps:**
1. Tulis `scripts/social-post.js`:
   - Load `.env.local`, koneksi `postgres` ke `DATABASE_URL` (pola identik `daily-article.js`).
   - Query: `select * from articles where status = 'published' and social_posted_at is null order by created_at asc` (mirror `needsSocialPost` — duplikasi logic inline sesuai konvensi).
   - Untuk tiap artikel: ambil `article_translations` locale `id`, duplikasi `splitSections`/`buildSlidePlan` logic inline, `compositeSlideImage` logic inline (pakai `sharp`, sudah jadi dependency asli — `require('sharp')` valid dari CJS), `persistImageLocally`-equivalent (duplikasi, simpan ke `public/uploads/`, base URL `https://kionixinterior.com`), tambahkan `public/social/cta-slide.jpg` sebagai slide terakhir (URL publik `https://kionixinterior.com/social/cta-slide.jpg` — pastikan `public/social/` ke-serve statis oleh Next, atau copy ke `public/uploads/` juga supaya lolos lewat route `/uploads/[...path]` yang pasti jalan di semua kondisi deploy).
   - `buildCaption` + `buildZernioPayload` + `postToZernio` logic inline, pakai `process.env.ZERNIO_API_KEY`.
   - Kalau sukses (HTTP 2xx dari Zernio): `update articles set social_posted_at = now() where id = ...`.
   - Kalau gagal 1 artikel: log error, `continue` ke artikel berikutnya (JANGAN `process.exit(1)` di tengah loop — biar artikel lain tetap diproses; beda dari `daily-article.js` yang cuma proses 1 topik per run).
2. **Dry-run dulu (WAJIB, bukan opsional):** jalankan `node scripts/social-post.js --dry-run` (flag baru — kalau di-set, build semua payload + slide image, print ke console, JANGAN panggil `postToZernio`, JANGAN update DB). Cek manual: caption masuk akal, urutan slide benar, tidak ada gambar rusak/URL kosong.
3. Setelah dry-run oke, jalankan `node scripts/social-post.js` (TANPA `--dry-run`) sekali secara manual, LIVE, terhadap **hanya 1 artikel** dulu (batasi query dengan `limit 1` sementara, atau jalankan lalu segera `Ctrl+C`/matikan setelah 1 artikel pertama kalau khawatir rate limit) — ini benar-benar posting ke Instagram & TikTok asli Kionix. **User HARUS melihat hasilnya di app IG/TikTok sebelum lanjut ke backfill 6 artikel sisanya.**
4. Setelah user konfirmasi post pertama terlihat benar, jalankan lagi tanpa batasan `limit 1` supaya 5 artikel sisanya ikut terproses (backfill selesai).
5. Commit: "feat: add scripts/social-post.js (Zernio auto-posting cron script)"

**Verification:**
- [ ] `node -c scripts/social-post.js` (syntax check) passes
- [ ] Dry-run (`--dry-run`) jalan tanpa error, output payload masuk akal untuk minimal 2 artikel berbeda
- [ ] 1 post live pertama SUDAH DIKONFIRMASI MANUAL oleh user muncul benar di Instagram & TikTok Kionix sebelum lanjut backfill
- [ ] Setelah backfill: `select count(*) from articles where status='published' and social_posted_at is null` = 0
- [ ] No placeholder/TODO comments
- [ ] **Security check:** `ZERNIO_API_KEY` tidak pernah muncul di `console.log`/error output skrip ini

---

### Phase 8: Cron wiring + docs

**Estimated time:** 10 menit

**Files:**
- Modify: `Dockerfile` (tambah baris crontab di stage `cron`)
- Modify: `CLAUDE.md` (dokumentasikan fitur baru, pola sama seperti section "Daily trending article generator")

**Steps:**
1. Write failing test: N/A — perubahan Dockerfile/dokumentasi murni, tidak ada logic baru. (ponytail: skip TDD gate di sini, tidak ada behavior untuk di-test selain "container build sukses" yang divalidasi manual di Phase 9 deploy.)
2. Di `Dockerfile` stage `cron`, ubah baris crontab jadi 2 baris:
   ```
   0 6,16 * * * cd /app && node scripts/daily-article.js >> /proc/1/fd/1 2>&1
   15 6,16 * * * cd /app && node scripts/social-post.js >> /proc/1/fd/1 2>&1
   ```
   (jeda 15 menit setelah `daily-article.js`, supaya artikel + gambar barunya sudah pasti commit duluan)
3. Tambahkan section baru di `CLAUDE.md` (setelah "Daily trending article generator") yang mendokumentasikan: `scripts/social-post.js`, kolom `social_posted_at`, kontrak Zernio (ringkas, link ke `docs/plans/2026-08-26-instagram-tiktok-auto-posting.md` untuk detail penuh), env var `ZERNIO_API_KEY`.
4. Commit: "feat: wire social-post.js into cron schedule + docs"

**Verification:**
- [ ] `docker build --target cron .` sukses lokal (kalau Docker Desktop nyala) — atau minimal `node -c scripts/social-post.js` + `cat Dockerfile` visual-check crontab line benar
- [ ] CLAUDE.md ter-update, tidak ada informasi yang sekarang salah (spec lama soal ffmpeg/video sudah tidak disebut di mana pun)

---

### Phase 9: Deploy ke production

**Estimated time:** 15 menit

**Files:** tidak ada file baru — operasional deploy.

**Steps:**
1. Write failing test: N/A — deploy operasional, bukan kode baru.
2. **Migration prod DB:** SSH ke VPS (`indusia-vps`, `/opt/kionixinterior-web`), jalankan migration Drizzle terhadap DB production (`docker compose -f docker-compose.prod.yml exec web npx drizzle-kit migrate` atau setara — cek `package.json`/`drizzle.config.ts` untuk command yang benar persis) supaya kolom `social_posted_at` ada di prod SEBELUM cron baru jalan di sana.
3. **Tambahkan `ZERNIO_API_KEY`** ke `docker-compose.prod.yml` di VPS (edit manual lewat SSH — file ini gitignored, tidak ikut `git pull`) untuk service `web` dan `cron`, pakai value yang sama dari `.env.local` lokal.
4. `git push` (dari lokal), lalu di VPS: `git pull && docker compose -f docker-compose.prod.yml up -d --build`.
5. Verifikasi: `curl -sI https://kionixinterior.com` = 200; cek `docker exec kionixinterior-web-cron-1 crontab -l` menunjukkan 2 baris (daily-article + social-post).
6. **JANGAN otomatis backfill 6 artikel di production tanpa persetujuan eksplisit** — ini akan langsung post ke akun sosial ASLI Kionix. Tanya user dulu sebelum menjalankan backfill di prod (beda dengan Phase 7 yang boleh dicoba di DB lokal/dev kalau ada akun sandbox — kalau tidak ada sandbox, Phase 7 DAN backfill produksi adalah kejadian yang sama, jadi cukup dilakukan sekali, di production, dengan approval).

**Verification:**
- [ ] Production 200 OK di 3 locale (`/`, `/en`, `/zh`)
- [ ] Kolom `social_posted_at` ada di skema DB production
- [ ] Crontab production menunjukkan 2 baris yang benar
- [ ] User sudah approve sebelum backfill live jalan di production
- [ ] **Security check:** `ZERNIO_API_KEY` tidak pernah muncul di git diff/commit manapun (cek `git log -p` untuk `docker-compose.prod.yml` — harusnya file ini memang tidak pernah di-commit sama sekali)
