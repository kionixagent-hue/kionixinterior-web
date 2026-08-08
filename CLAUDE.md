# Kionix Interior — CLAUDE.md

Next.js 14 (App Router) marketing site + bilingual blog + admin CMS for Kionix Interior (Batam interior design/renovation). Postgres via Drizzle ORM, custom cookie-session admin auth (no Supabase/NextAuth), next-intl i18n.

## Commands

```bash
npm run dev              # dev server
npm run build             # production build (also runs next lint + tsc as part of build)
npx tsc --noEmit           # type check only
npx jest                   # full test suite (Jest + Testing Library, jsdom env)
npx jest <name>             # run tests matching filename, e.g. `npx jest EditForm`
npx next lint               # lint only
npm run db:generate          # drizzle-kit generate (schema -> migration in ./drizzle)
npm run db:migrate            # drizzle-kit migrate (apply to DATABASE_URL)
node scripts/create-admin.js   # create an admin_users row (interactive/env-based)
npm run article:seed            # seed a demo article (scripts/seed-article.js)
npm run article:images           # backfill cover+body images for the seeded article (scripts/generate-article-images.js)
```

Env vars (`.env.local`, gitignored; `.env.example` documents keys): `DATABASE_URL`, `SESSION_SECRET`, `SNAPGEN_API_KEY`.

## Architecture

- **Public site**: `src/app/[locale]/` — `page.tsx` (landing sections: Hero, Layanan, Portfolio, TentangKami, KlienKami, Testimoni, BlogSection teaser, Kontak, FloatingWA), `blog/page.tsx` (index), `blog/[slug]/page.tsx` (article + JSON-LD).
- **Admin CMS**: `src/app/admin/` — `page.tsx` (list), `new/page.tsx` (create draft), `[id]/page.tsx` + `[id]/EditForm.tsx` (edit/review/publish), `login/`. All mutations go through `src/app/admin/actions.ts` (`'use server'`), every action starts with the file-local `requireUser()` (cookie session check, throws `'Unauthorized'`).
- **Auth**: custom, not a library. `src/lib/auth/session.ts` — HMAC-SHA256 session tokens via Web Crypto (Edge-runtime-safe, used from `middleware.ts`). `src/lib/auth/password.ts` — password hashing. `src/middleware.ts` gates `/admin/*` (redirects to `/admin/login` if no valid session) and separately runs next-intl's locale middleware for everything else, plus a Cloudflare-tunnel-specific `cf-ipcountry` check (not `request.geo`, which is always empty behind the tunnel) to default Indonesian visitors to `id` before next-intl's own negotiation runs.
- **i18n**: `src/i18n/routing.ts` — locales `id`/`en`/`zh`, default `id`, `localePrefix: 'as-needed'`. Blog content is **only `id`/`en`** — `zh` blog routes return `notFound()`. Messages in `src/messages/{id,en,zh}.json`.
- **DB**: `src/lib/db/schema.ts` (Drizzle, Postgres). Tables: `articles` (status/tags/coverImageUrl/publishedAt), `article_translations` (locale-scoped title/body/quickAnswer/metaDescription/faq, unique on `(locale, slug)` and `(articleId, locale)`), `topics` (keyword discovery queue — **schema only, no auto-generation pipeline wired up yet**), `admin_users`. Client: `src/lib/db/client.ts` (`drizzle(postgres(DATABASE_URL))`).
- **Design tokens** (`tailwind.config.ts`): `accent #26A1B0` / `accent-hover #1D8898`, `bg-dark #0C1A1D`, `bg-section #EFF7F8`, `border #C8E4E8`, `text-muted #607A80`, `text-on-dark #FFFFFF`, `wa-green #25D366`. Fonts: `font-serif` (Cormorant, headings), `font-sans` (Plus Jakarta Sans, body). No CSS-in-JS — Tailwind utility classes only.

## Article image generation (snapgen.ai)

- `src/lib/images/sections.ts` — pure: `splitSections`/`qualifyingSections`/`insertImageAfterSection` (positional-offset based, not text-replace — duplicate headings don't collide) + `buildSectionImagePrompt`/`buildCoverPrompt`.
- `src/lib/images/snapgen.ts` — `generateImage(apiKey, {prompt, aspect_ratio}, pollConfig?)`: POST `/generate_image`, polls `/history/{uuid}` until done. Model fixed to `nano-banana-pro` (free tier), style fixed to `Photorealistic`.
- Server actions (`src/app/admin/actions.ts`): `generateCoverImage`/`generateBodySectionImage` (call snapgen), `updateCoverImage` (persists immediately — not deferred to the save button), `createDraftArticle` accepts optional `coverImageUrl`.
- UI: `src/components/admin/CoverImageField.tsx` (prompt textarea + preview; tracks a live `initialPrompt` via `useEffect` until the admin edits it manually — a mount-only `useState` would leave auto-suggest permanently blank) and `GenerateImagesButton.tsx` (one click walks all qualifying `## ` sections, inserts `![heading](url)` after each). Both take callback props (`onGenerate`/`onGenerated`/`onBodyChange`) — decoupled from server actions for testability.
- `scripts/generate-article-images.js` is a standalone CommonJS backfill script (plain `node`, not part of the Next bundle) — deliberately does **not** import `src/lib/images/*` (no `tsx`/`ts-node` dep in this project to bridge CJS→TS).

## Non-obvious gotchas

- **First test importing a file that pulls in `react-markdown`** hits a jest transform error (`Unexpected token 'export'`) — `react-markdown`'s ESM dependency tree isn't in `jest.config.ts`'s `transformIgnorePatterns`. Fix per-test with `jest.mock('react-markdown', ...)` rather than widening the global config.
- `next build` runs ESLint as part of the build and **fails the build** on unused vars/params — even in test files. `npx tsc --noEmit` alone won't catch this.
- Drizzle query results (`db.query.articles.findFirst({ with: { translations: true } })`) return all real columns automatically — no need to touch the query when a prop type adds a new column, just extend the TS type.
- `cover_image_url` lives on `articles` (article-level), not `article_translations` — one cover per article, not per locale.
- No `CLAUDE.md`-driven KB integration is configured for this repo beyond this file; `docs/plans/*.md` is the project's running design/plan history (read those for "why", this file is for "what/where").

## Testing conventions

Jest + Testing Library (`jest.config.ts`: jsdom env, `@/*` → `src/*`). Pure logic lives in small `src/lib/**` files and gets full unit coverage (e.g. `src/lib/blog/{slug,status,readingTime}.ts`, `src/lib/images/sections.ts`). DB-touching server actions are tested by mocking `@/lib/db/client`'s chainable query builder (see `src/__tests__/BlogSection.test.tsx` or `adminImageActions.test.ts` for the pattern) rather than hitting real Postgres. No test currently spins up a real DB.

## Key docs

- `docs/plans/2026-06-23-kionix-interior.md` — initial site build
- `docs/plans/2026-07-23-multi-language-i18n.md` — id/en/zh i18n
- `docs/plans/2026-08-04-kionix-blog-seo-geo.md` — blog + admin CMS + auth
- `docs/plans/2026-08-08-article-image-generation.md` — snapgen.ai cover/body image generation
