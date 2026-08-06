# Kionix Blog — SEO & GEO Content Engine (Phase 1: Blog Infrastructure)

## Project Brief

| Info | Detail |
|---|---|
| **Goal** | Blog section on the Kionix Interior site to drive SEO (local search, "jasa desain interior Batam") and GEO (Generative Engine Optimization — getting cited by AI answer engines like ChatGPT/Perplexity/Google AI Overview) |
| **Scope of this spec** | Sub-project 1 of 2: blog infrastructure (routing, DB, admin review, SEO/GEO markup) with manually-authored seed content. Sub-project 2 (auto topic-discovery + AI draft generation) is a separate future brainstorm — this spec only prepares the DB schema (`topics` table) for it. |
| **Stack** | Next.js 14 App Router + next-intl (existing) + Supabase Postgres (new) + Drizzle ORM (new) + Supabase Auth (new) |
| **Languages** | Bahasa Indonesia (primary) + English |
| **Publish workflow** | Draft → review (manual edit) → publish |
| **URL structure** | Flat: `/[locale]/blog/[slug]`, categorization via tags (not URL path) |

---

## Why (context)

Kionix Interior is a one-page company profile site (see `docs/plans/2026-06-23-kionix-interior.md`) with no content-marketing surface. The business wants organic discovery both through traditional local search and through AI answer engines, which are increasingly where people ask "rekomendasi jasa interior Batam"-style questions.

Light research (2026-08-04) on current GEO practice informed two decisions:
- **Skip `llms.txt`.** It is not part of any major AI answer engine's citation/retrieval pipeline (verified across multiple 2026 sources) — it's primarily an IDE-agent (Cursor/Claude Code/etc.) discovery convention, not a blog-citation lever. Not worth building for this use case.
- **Prioritize Article/BlogPosting + LocalBusiness JSON-LD, quick-answer blocks, and evidence-dense structure.** These are the levers 2026 sources consistently point to for both AI Overview citation and rich-result eligibility. FAQ rich *results* were retired by Google in May 2026 for most site categories, but `FAQPage` markup is still valid for machine parsing — so the FAQ content format stays, decorative FAQ schema is optional/low-priority.

Related precedent in this project family: ADR-2026-07-24 "KIONIX RAB Engine" (cross-project knowledge base, `design-decisions/2026-07-24-kionix-rab-engine-nextjs-postgres.md`) established Next.js monolith + Postgres as the default architecture for internal Kionix tooling, and validated that Firecrawl reliably surfaces Batam-localized data — relevant when sub-project 2 (topic discovery) is designed later.

---

## Architecture

**Stack decision:** Supabase (Postgres + Auth) + Drizzle ORM, in the existing Next.js monolith (no new service).

- Supabase over plain Neon: the admin review page needs real login for multiple internal reviewers — Supabase Auth gives a proper login flow out of the box instead of hand-rolling Basic Auth.
- Drizzle over Prisma: lighter, no codegen step, stays close to SQL — matches the project's existing lean dependency footprint (package.json has zero backend deps today).
- New env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (admin writes), `DATABASE_URL` (Drizzle direct connection).

### DB Schema

```sql
articles
  id            uuid pk
  status        text check in ('draft','in_review','published')
  tags          text[]              -- native Postgres array, no join table needed
  cover_image_url text nullable
  created_at    timestamptz
  published_at  timestamptz nullable
  updated_at    timestamptz

article_translations
  id            uuid pk
  article_id    uuid fk -> articles
  locale        text check in ('id','en')
  slug          text
  title         text
  quick_answer  text                -- 2-3 sentence direct-answer block, GEO extraction target
  body          text                -- markdown
  meta_description text
  faq           jsonb               -- [{q, a}], native jsonb, no separate table
  unique(locale, slug)
  unique(article_id, locale)

topics                              -- schema only, populated later by sub-project 2
  id            uuid pk
  keyword       text
  source        text default 'google_trends'
  score         numeric nullable
  discovered_at timestamptz
  status        text check in ('new','used','dismissed')
```

`reading_time` is computed at render time from `body` word count — not stored (no write path needs it, avoids a stale-cache field).

Author is a fixed string ("Tim Kionix Interior") used directly in JSON-LD and byline — no author table until Kionix actually has multiple named writers (YAGNI).

---

## Design

### Aesthetic Direction

Extends the existing "Indonesian Modern Prestige" system (Cormorant Garamond display + Plus Jakarta Sans body, `#26A1B0` teal accent, off-white/charcoal-navy palette) into editorial mode — same tokens, same asymmetric bento language, applied to the three new surfaces below. Admin page also carries the brand tokens (per user preference) rather than a stripped-down utilitarian look.

### Blog Index — `/[locale]/blog`

- Asymmetric bento: 1 large featured article + smaller grid tiles (not a uniform card grid)
- Tag filter as horizontal-scroll pill row (teal `#26A1B0` active state), not a dropdown
- One `bg-dark` (`#0C1A1D`) CTA band ("Konsultasi Gratis") inserted between article rows 2–3 to break up the list
- Title: Cormorant Garamond; excerpt/meta: Plus Jakarta Sans

### Article Page — `/[locale]/blog/[slug]`

- H1 (Cormorant Garamond) + meta row (date, reading time, tags)
- **Quick Answer box** directly under H1: `border-left: 3px solid #26A1B0`, `bg-section #EFF7F8`, 2–3 sentences answering the title's implicit question — this is the GEO extraction target
- Body in Plus Jakarta Sans with explicit H2/H3 per sub-topic (AI-parseable + human-scannable)
- FAQ accordion near the end, questions phrased as real search queries
- WhatsApp consultation CTA at the end (reuse existing `wa.me` pattern)
- JSON-LD: `BlogPosting` (author: "Tim Kionix Interior", publisher: Organization + logo, accurate `datePublished`/`dateModified`) + `LocalBusiness` (Ciptaland Batam address), both emitted on the same page

### Admin Review — `/admin`

- Gated by Supabase Auth (session check in middleware, internal accounts only, no public signup)
- List view: table of articles (title, tags, status badge, updated date) across all statuses
- **New Article** button → create form (title, tags, body, locale) — needed because sub-project 2 (auto-draft generation) doesn't exist yet, so this phase's content pipeline starts here
- Edit view: form fields for both locales + live preview pane, Approve & Publish / Reject actions
- Same brand tokens as the public site (per confirmed preference)

### Anti-AI-Slop Self-Check

- [x] No Inter/Roboto/Arial as primary (Cormorant Garamond + Plus Jakarta Sans, consistent with existing site)
- [x] No purple gradient on white
- [x] Asymmetric bento layout on index, not a generic card grid
- [x] Tag filter as scroll-pills, not a generic dropdown
- [x] Motion durations 150–600ms (reuse existing Framer Motion scroll-reveal pattern)
- [x] Icons from single library (Lucide React, already in use)
- [x] Specific microcopy ("Konsultasi Gratis", not "Learn More")
- [x] CTA hierarchy clear (WhatsApp primary on article + index CTA band)

### Accessibility

- Semantic HTML: `<article>`, `<nav>` for tag filter, `<section aria-label>` for FAQ
- FAQ accordion: `aria-expanded`, keyboard-operable
- Contrast: reuses existing tokens already validated at ~12:1 (WCAG AAA) in the base design system
- Admin forms: label association, `aria-invalid` on validation errors

---

## Data Integration Map

| Component | Data Source | Existing? | Notes |
|---|---|---|---|
| Article content (id/en) | Supabase Postgres `article_translations` | New | slug/title/quick_answer/body/meta_description/faq(jsonb) per locale |
| Article metadata | Supabase Postgres `articles` | New | status, tags text[], cover_image_url |
| Topic queue (future automation) | Supabase Postgres `topics` | New, schema-only | no writer in this phase |
| Admin auth | Supabase Auth | New | manual internal accounts only |
| Locale routing | next-intl `[locale]` segment | Existing | reuse current pattern |
| WhatsApp CTA | `wa.me/6281372703589` | Existing | reuse Hero/FloatingWA/Kontak pattern |
| Brand tokens | `docs/plans/2026-06-23-kionix-interior.md` | Existing | colors, fonts |
| Org/logo for JSON-LD | `LOGO KIONIX NEW1.jpg` / `.png` | Existing | Organization + BlogPosting publisher |

## Out of Scope (deferred to sub-project 2)

- Auto topic discovery (Google Trends integration)
- AI-generated draft creation
- Any scheduling/cron automation

## Implementation Plan

> **For Claude:** REQUIRED SKILL: Use gaspol-execute to implement this plan.
> **CRITICAL:** This plan specifies real integrations. During execution,
> NEVER substitute placeholders for real data sources without explicit
> user approval. If a data source doesn't exist yet, STOP and ask.
> **Progress ledger — HARD PER-PHASE GATE:** `.gaspol/progress/kionix-blog-seo-geo.md`. After EACH phase and **BEFORE** starting the next, STOP and append that phase's line — status `done` + the exact command you ran and its result. This is **blocking**: no next phase until the line is written. Set `doing` when a phase starts, `done` when its tests pass. **Never batch all updates at the end.** Update ONLY this file.
> **Self-contained:** this plan is the COMPLETE spec, executable with no other context. Every file path, schema, and contract is written here verbatim.

## Goal

Build the blog infrastructure for Kionix Interior: a Postgres-backed (Supabase) blog with an internal admin review/publish workflow, and public `/blog` pages structured for both traditional SEO and GEO (Generative Engine Optimization). Manually-authored content only in this phase — the auto topic-discovery/generation engine is a separate future project (see "Out of Scope" above).

## Architecture Context

- Existing stack: Next.js 14 App Router, next-intl (`src/i18n/routing.ts` — locales `id`/`en`/`zh`, `defaultLocale: 'id'`, `localePrefix: 'as-needed'`), Tailwind, Framer Motion, Jest + Testing Library (`jest.config.ts`, `testEnvironment: jest-environment-jsdom`, tests live in `src/__tests__/*.test.[jt]sx`).
- Existing middleware: `src/middleware.ts` runs `next-intl`'s `createMiddleware(routing)` on every non-API/non-asset path. This plan modifies it (not replaces) to branch `/admin` to a Supabase auth guard instead of the intl middleware.
- Existing brand tokens (from `docs/plans/2026-06-23-kionix-interior.md`, also wired into `src/app/[locale]/layout.tsx` as CSS font vars `--font-cormorant` / `--font-jakarta`): `bg-base #FAFAFA`, `bg-section #EFF7F8`, `bg-dark #0C1A1D`, `accent #26A1B0`, `accent-hover #1D8898`, `text-primary #0C1A1D`, `text-muted #607A80`, `border #C8E4E8`.
- Existing reusable pieces: `src/lib/constants.ts` (`WHATSAPP_URL`, `COMPANY_NAME`), `public/logo.png` (web-accessible logo for JSON-LD), `src/app/sitemap.ts` (static per-locale sitemap, this plan extends it).
- Blog content covers only `id` and `en` (not `zh` — confirmed in brainstorm). `/zh/blog/*` returns `notFound()`.

## Tech Stack (new additions this plan introduces)

| Package | Purpose |
|---|---|
| `drizzle-orm`, `drizzle-kit` (dev), `postgres` | Postgres schema + query layer, migrations |
| `@supabase/supabase-js`, `@supabase/ssr` | Supabase Auth (admin login/session) |
| `react-markdown` | Render article `body` (markdown) safely — admin preview pane + public article page, no `dangerouslySetInnerHTML` |

No new testing/UI frameworks — reuse Jest + React Testing Library + Tailwind + Framer Motion already in the project.

## Data Integration Map

| Feature | Data Source | Hook/API | Exists? | Action |
|---|---|---|---|---|
| Article/translation/topic tables | Supabase Postgres | `src/lib/db/schema.ts` (Drizzle) | No | Create new |
| DB client | Supabase Postgres via `DATABASE_URL` | `src/lib/db/client.ts` | No | Create new |
| Admin session check | Supabase Auth | `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts` | No | Create new |
| `/admin` route protection | — | `src/middleware.ts` | Yes | Modify (branch to auth guard) |
| Locale list for content availability | next-intl | `src/i18n/routing.ts` (`routing.locales`) | Yes | Use existing |
| WhatsApp CTA | — | `src/lib/constants.ts` (`WHATSAPP_URL`) | Yes | Use existing |
| Brand fonts/colors | — | `src/app/[locale]/layout.tsx` font vars + Tailwind config | Yes | Reuse existing |
| Logo for JSON-LD | — | `public/logo.png` | Yes | Use existing (absolute URL `https://kionixinterior.com/logo.png`) |
| Sitemap | Published articles | `src/app/sitemap.ts` | Yes (static) | Modify to add dynamic blog entries |

---

### Phase 1: DB Schema & Migration

**Estimated time:** 15 minutes

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `drizzle.config.ts`
- Create: `.env.example`
- Test: `src/__tests__/dbSchema.test.ts`
- Modify: `package.json` (deps + `db:generate`/`db:migrate` scripts)

**Steps:**
1. Write failing test in `src/__tests__/dbSchema.test.ts` asserting `articles`, `articleTranslations`, `topics` are exported from `@/lib/db/schema` with the expected column keys (e.g. `Object.keys(articles)` includes `status`, `tags`, `coverImageUrl`; `articleTranslations` includes `locale`, `slug`, `quickAnswer`, `faq`). Expected error: `Cannot find module '@/lib/db/schema'`.
2. Run test, confirm it fails for that reason.
3. `npm install drizzle-orm postgres @supabase/supabase-js @supabase/ssr react-markdown` and `npm install -D drizzle-kit`.
4. Implement `src/lib/db/schema.ts` with exactly this shape:
   ```ts
   import { pgTable, uuid, text, timestamp, jsonb, numeric, pgEnum, unique } from 'drizzle-orm/pg-core'

   export const articleStatusEnum = pgEnum('article_status', ['draft', 'in_review', 'published'])
   export const articleLocaleEnum = pgEnum('article_locale', ['id', 'en'])
   export const topicStatusEnum = pgEnum('topic_status', ['new', 'used', 'dismissed'])

   export const articles = pgTable('articles', {
     id: uuid('id').defaultRandom().primaryKey(),
     status: articleStatusEnum('status').notNull().default('draft'),
     tags: text('tags').array().notNull().default([]),
     coverImageUrl: text('cover_image_url'),
     createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
     publishedAt: timestamp('published_at', { withTimezone: true }),
     updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
   })

   export const articleTranslations = pgTable('article_translations', {
     id: uuid('id').defaultRandom().primaryKey(),
     articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
     locale: articleLocaleEnum('locale').notNull(),
     slug: text('slug').notNull(),
     title: text('title').notNull(),
     quickAnswer: text('quick_answer').notNull(),
     body: text('body').notNull(),
     metaDescription: text('meta_description').notNull(),
     faq: jsonb('faq').$type<{ q: string; a: string }[]>().notNull().default([]),
   }, (table) => ({
     localeSlugUnique: unique().on(table.locale, table.slug),
     articleLocaleUnique: unique().on(table.articleId, table.locale),
   }))

   export const topics = pgTable('topics', {
     id: uuid('id').defaultRandom().primaryKey(),
     keyword: text('keyword').notNull(),
     source: text('source').notNull().default('google_trends'),
     score: numeric('score'),
     discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
     status: topicStatusEnum('status').notNull().default('new'),
   })
   ```
5. Create `drizzle.config.ts` pointing `schema: './src/lib/db/schema.ts'`, `out: './drizzle'`, `dialect: 'postgresql'`, `dbCredentials.url: process.env.DATABASE_URL`.
6. Create `.env.example` with `DATABASE_URL=`, `SUPABASE_URL=`, `SUPABASE_ANON_KEY=`, `SUPABASE_SERVICE_ROLE_KEY=`.
7. Add npm scripts: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`.
8. Run test, confirm it passes.
9. Run `npm run db:generate` to produce the migration SQL in `drizzle/`.
10. **Manual step (cannot be automated in CI):** create a Supabase project, set `.env.local` from `.env.example`, run `npm run db:migrate` against it, confirm the 3 tables exist in Supabase Studio.
11. Commit: "feat: add blog DB schema (articles, article_translations, topics)"

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `dbSchema.test.ts` passes
- [ ] `drizzle/` contains a generated migration matching the schema
- [ ] Manual: migration applied to a real Supabase project, 3 tables visible in Supabase Studio
- [ ] No placeholder/TODO comments in new code

---

### Phase 2: Blog Pure Helpers (slug, reading time)

**Estimated time:** 10 minutes

**Files:**
- Create: `src/lib/blog/slug.ts`
- Create: `src/lib/blog/readingTime.ts`
- Test: `src/__tests__/blogSlug.test.ts`
- Test: `src/__tests__/blogReadingTime.test.ts`

**Steps:**
1. Write failing test: `generateSlug('Tips Interior Minimalis Batam!')` should equal `'tips-interior-minimalis-batam'`. Expected error: `Cannot find module '@/lib/blog/slug'`.
2. Run test, confirm it fails.
3. Implement `generateSlug(title: string): string` — lowercase, strip non-alphanumeric (replace with `-`), collapse repeated `-`, trim leading/trailing `-`.
4. Run test, confirm it passes.
5. Write failing test: `computeReadingTime('word '.repeat(400))` should equal `2` (400 words / 200 wpm). Expected error: `Cannot find module '@/lib/blog/readingTime'`.
6. Implement `computeReadingTime(body: string): number` — split on whitespace, `Math.max(1, Math.ceil(wordCount / 200))`.
7. Run test, confirm it passes.
8. Commit: "feat: add blog slug + reading time helpers"

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] Both test files pass, including an edge case each (empty title → `generateSlug` doesn't crash; empty body → `computeReadingTime` returns 1)
- [ ] No placeholder/TODO comments

---

### Phase 3: Supabase Auth Guard for `/admin`

**Estimated time:** 15 minutes

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/lib/supabase/authGuard.ts`
- Modify: `src/middleware.ts`
- Create: `src/app/admin/login/page.tsx`
- Test: `src/__tests__/authGuard.test.ts`

**Steps:**
1. Write failing test for `shouldRedirectToLogin(pathname, hasUser)`: `shouldRedirectToLogin('/admin', false) === true`, `shouldRedirectToLogin('/admin/login', false) === false`, `shouldRedirectToLogin('/admin', true) === false`, `shouldRedirectToLogin('/blog', false) === false`. Expected error: `Cannot find module '@/lib/supabase/authGuard'`.
2. Run test, confirm it fails.
3. Implement `src/lib/supabase/authGuard.ts`:
   ```ts
   export function shouldRedirectToLogin(pathname: string, hasUser: boolean): boolean {
     if (!pathname.startsWith('/admin')) return false
     if (pathname.startsWith('/admin/login')) return false
     return !hasUser
   }
   ```
4. Run test, confirm it passes.
5. Implement `src/lib/supabase/server.ts` — `createClient()` using `createServerClient` from `@supabase/ssr`, reading cookies via `next/headers`.
6. Implement `src/lib/supabase/middleware.ts` — `updateSession(request: NextRequest)`: builds a Supabase server client wired to the request/response cookies, calls `supabase.auth.getUser()`, uses `shouldRedirectToLogin` to decide whether to `NextResponse.redirect('/admin/login')`, else returns the (cookie-refreshed) response.
7. Modify `src/middleware.ts`: keep the existing `next-intl` middleware for all routes, but branch: if `request.nextUrl.pathname.startsWith('/admin')`, call `updateSession(request)` instead of the intl middleware. Matcher stays as-is (already covers `/admin`, since it's not an api/asset path).
8. Implement `src/app/admin/login/page.tsx` — plain form (email + password), calls `supabase.auth.signInWithPassword` via a client component, redirects to `/admin` on success, shows inline error on failure. Uses brand tokens (Cormorant Garamond heading, teal accent button) per confirmed preference.
9. Manual verification: create one internal user in Supabase Auth dashboard (no public signup path exists), confirm login works and `/admin` redirects to `/admin/login` when logged out.
10. Commit: "feat: add Supabase auth guard for /admin"

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `authGuard.test.ts` passes (all 4 cases)
- [ ] Manual: unauthenticated request to `/admin` redirects to `/admin/login`; authenticated session reaches `/admin`
- [ ] Security: no service-role key used client-side (only `SUPABASE_ANON_KEY` in browser/session code), session cookies are httpOnly (default via `@supabase/ssr`), no credentials logged
- [ ] No placeholder/TODO comments

---

### Phase 4: Admin — Article List + Create Draft

**Estimated time:** 15 minutes

**Files:**
- Create: `src/lib/db/client.ts`
- Create: `src/app/admin/actions.ts` (Server Actions)
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/new/page.tsx`
- Create: `src/components/admin/ArticleStatusBadge.tsx`
- Test: `src/__tests__/ArticleStatusBadge.test.tsx`

| Phase | Code Deliverable | Design Deliverable | Verification |
|---|---|---|---|
| 4 | Admin list + create form | Brand-tokened utilitarian table (per confirmed admin design: Kionix tokens, not stripped-down) — status badge colors: draft=`text-muted`/`border` gray-teal, in_review=`accent` outline, published=solid `accent` bg | Design tokens used, no hardcoded hex outside `tailwind.config.ts` |

**Steps:**
1. Write failing test: `<ArticleStatusBadge status="published" />` renders text `"Published"` with class containing the accent token. Expected error: `Cannot find module '@/components/admin/ArticleStatusBadge'`.
2. Run test, confirm it fails.
3. Implement `ArticleStatusBadge` (maps `draft`/`in_review`/`published` → label + Tailwind classes using existing tokens).
4. Run test, confirm it passes.
5. Implement `src/lib/db/client.ts`:
   ```ts
   import { drizzle } from 'drizzle-orm/postgres-js'
   import postgres from 'postgres'
   import * as schema from './schema'

   const client = postgres(process.env.DATABASE_URL!, { prepare: false })
   export const db = drizzle(client, { schema })
   ```
6. Implement `src/app/admin/actions.ts` Server Action `createDraftArticle(input)` — takes `{ tags: string[], translations: { locale: 'id'|'en', title, quickAnswer, body, metaDescription, faq }[] }`, inserts one `articles` row (`status: 'draft'`) + one `articleTranslations` row per translation (using `generateSlug` from Phase 2 for each translation's `slug`), calls `revalidatePath('/admin')`.
7. Implement `src/app/admin/page.tsx` (Server Component) — queries all articles + their translations via `db.query.articles.findMany({ with: { translations: true } })`, renders as a table (title from `id` translation, tags, `ArticleStatusBadge`, updated date), each row links to `/admin/[id]`.
8. Implement `src/app/admin/new/page.tsx` — client form with fields for both locales (title, quick answer, body textarea, meta description, repeatable FAQ q/a rows), tags as comma-separated input, submits to `createDraftArticle`.
9. Manual verification: create a draft via the form, confirm it appears in `/admin` list with `draft` badge and a row in both `articles` and `article_translations` (2 rows, one per locale) in Supabase Studio.
10. Commit: "feat: add admin article list + create draft"

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `ArticleStatusBadge.test.tsx` passes
- [ ] Manual: create flow writes real rows to Supabase (not mocked), list page reads real data
- [ ] Security: Server Action runs server-side only, inputs are typed (no `any`), DB writes go through Drizzle's parameterized queries (no raw string SQL)
- [ ] No placeholder/TODO comments

---

### Phase 5: Admin — Edit, Review & Publish/Reject

**Estimated time:** 15 minutes

**Files:**
- Create: `src/app/admin/[id]/page.tsx`
- Modify: `src/app/admin/actions.ts` (add `updateArticleTranslation`, `publishArticle`, `rejectArticle`)
- Test: `src/__tests__/articleStatusTransition.test.ts`

| Phase | Code Deliverable | Design Deliverable | Verification |
|---|---|---|---|
| 5 | Admin edit/review page with live preview | Split layout: form left, `react-markdown`-rendered preview right (reuses public article typography — Cormorant headings, Plus Jakarta Sans body — so reviewers see how it'll actually look) | Preview visually matches public article page styling |

**Steps:**
1. Write failing test for a pure helper `nextStatus(action: 'publish' | 'reject', current: ArticleStatus): ArticleStatus` — `nextStatus('publish', 'draft') === 'published'`, `nextStatus('publish', 'in_review') === 'published'`, `nextStatus('reject', 'in_review') === 'draft'`. Expected error: function not defined (add to `src/lib/blog/status.ts`, new file).
2. Run test, confirm it fails.
3. Implement `src/lib/blog/status.ts` with `nextStatus`.
4. Run test, confirm it passes.
5. Add to `src/app/admin/actions.ts`:
   - `updateArticleTranslation(articleId, locale, fields)` — updates one `article_translations` row, sets parent `articles.updatedAt = now()`.
   - `publishArticle(articleId)` — uses `nextStatus('publish', current)`, sets `status`, and `publishedAt = now()` only if it was previously null (don't overwrite on republish-after-edit).
   - `rejectArticle(articleId)` — uses `nextStatus('reject', current)`.
6. Implement `src/app/admin/[id]/page.tsx` — fetch article + both translations by id, form pre-filled per locale (tab or side-by-side), live preview pane using `react-markdown` on the `body` field, "Approve & Publish" and "Reject" buttons wired to the actions above.
7. Manual verification: edit a draft, publish it, confirm `status='published'` and `published_at` set in Supabase; edit an already-published article and confirm `published_at` is NOT reset.
8. Commit: "feat: add admin edit/review/publish flow"

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `articleStatusTransition.test.ts` passes
- [ ] Manual: publish sets status+timestamp correctly; republish-after-edit doesn't reset `published_at`
- [ ] Security: same as Phase 4 (server-side actions, parameterized queries, no raw SQL)
- [ ] No placeholder/TODO comments

---

### Phase 6: Public Blog Index Page

**Estimated time:** 15 minutes

**Files:**
- Create: `src/app/[locale]/blog/page.tsx`
- Create: `src/components/BlogIndex.tsx`
- Create: `src/components/TagFilter.tsx`
- Test: `src/__tests__/BlogIndex.test.tsx`

| Phase | Code Deliverable | Design Deliverable | Verification |
|---|---|---|---|
| 6 | Blog index page | Asymmetric bento (1 featured + smaller grid), tag filter as horizontal-scroll pills (`accent` active state), `bg-dark` CTA band between rows 2-3 — per brainstorm "Blog Index" section | Layout matches brainstorm spec, not a uniform card grid |

**Steps:**
1. Write failing test: `<BlogIndex articles={mockPublished} />` renders only articles with `status === 'published'` (given a mix of draft+published mock data, draft titles must NOT appear). Expected error: `Cannot find module '@/components/BlogIndex'`.
2. Run test, confirm it fails.
3. Implement `BlogIndex` — takes pre-filtered published articles (filtering happens in the page's DB query, not in the component, but the component test still guards against a regression where an unfiltered list gets passed in — assert on the component's own defensive filter as a belt-and-suspenders check). Renders: first article as large featured tile, rest as smaller grid tiles, `TagFilter` above, one `bg-dark` CTA band after the 2nd row of smaller tiles.
4. Run test, confirm it passes.
5. Implement `TagFilter` — horizontal-scroll pill list, `accent` background on active tag, `?tag=` query param drives filtering (Next.js `useSearchParams` client component).
6. Implement `src/app/[locale]/blog/page.tsx` (Server Component) — for `locale === 'zh'`, call `notFound()`. Otherwise query `db.query.articles.findMany` joined to `articleTranslations` where `status = 'published'` and `articleTranslations.locale = locale`, ordered by `publishedAt desc`, pass to `BlogIndex`.
7. Manual verification: `npm run dev`, visit `/blog` and `/en/blog`, confirm only published seed articles show, tag filter works, `/zh/blog` 404s.
8. Commit: "feat: add public blog index page"

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `BlogIndex.test.tsx` passes
- [ ] Manual: draft articles never appear on `/blog`; `/zh/blog` returns 404
- [ ] No placeholder/TODO comments

---

### Phase 7: Public Blog Article Page + JSON-LD + Sitemap

**Estimated time:** 15 minutes

**Files:**
- Create: `src/app/[locale]/blog/[slug]/page.tsx`
- Create: `src/components/QuickAnswerBox.tsx`
- Create: `src/components/FaqAccordion.tsx`
- Create: `src/lib/blog/jsonld.ts`
- Modify: `src/app/sitemap.ts`
- Test: `src/__tests__/blogJsonld.test.ts`
- Test: `src/__tests__/QuickAnswerBox.test.tsx`

| Phase | Code Deliverable | Design Deliverable | Verification |
|---|---|---|---|
| 7 | Article page + JSON-LD | Quick-answer box (`border-left: 3px solid #26A1B0`, `bg-section #EFF7F8`) under H1, H2/H3-structured body via `react-markdown`, FAQ accordion, WhatsApp CTA — per brainstorm "Article Page" section | Quick-answer box renders above the fold, JSON-LD script tag present and valid |

**Steps:**
1. Write failing test: `buildBlogPostingJsonLd(mockArticle)` returns an object with `'@type': 'BlogPosting'`, `headline` equal to the title, `author.name === 'Tim Kionix Interior'`, `datePublished`/`dateModified` as ISO strings. Expected error: `Cannot find module '@/lib/blog/jsonld'`.
2. Run test, confirm it fails.
3. Implement `src/lib/blog/jsonld.ts` with `buildBlogPostingJsonLd(article)` and `buildLocalBusinessJsonLd()`:
   ```ts
   import { COMPANY_NAME } from '@/lib/constants'

   const SITE_URL = 'https://kionixinterior.com'

   export function buildBlogPostingJsonLd(article: {
     title: string; slug: string; locale: string; metaDescription: string
     createdAt: Date; updatedAt: Date; coverImageUrl: string | null
   }) {
     return {
       '@context': 'https://schema.org',
       '@type': 'BlogPosting',
       headline: article.title,
       description: article.metaDescription,
       image: article.coverImageUrl ?? `${SITE_URL}/logo.png`,
       datePublished: article.createdAt.toISOString(),
       dateModified: article.updatedAt.toISOString(),
       author: { '@type': 'Organization', name: 'Tim Kionix Interior' },
       publisher: {
         '@type': 'Organization', name: COMPANY_NAME,
         logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
       },
       mainEntityOfPage: {
         '@type': 'WebPage',
         '@id': `${SITE_URL}${article.locale === 'id' ? '' : '/' + article.locale}/blog/${article.slug}`,
       },
     }
   }

   export function buildLocalBusinessJsonLd() {
     return {
       '@context': 'https://schema.org',
       '@type': 'LocalBusiness',
       name: COMPANY_NAME,
       image: `${SITE_URL}/logo.png`,
       address: {
         '@type': 'PostalAddress',
         streetAddress: 'Ruko Ciptaland Blok Lavender No.26',
         addressLocality: 'Batam',
         addressCountry: 'ID',
       },
       telephone: '+6281372703589',
     }
   }
   ```
4. Run test, confirm it passes.
5. Write failing test: `<QuickAnswerBox text="..." />` renders the text inside an element with the teal border-left class. Expected error: `Cannot find module '@/components/QuickAnswerBox'`.
6. Implement `QuickAnswerBox` and `FaqAccordion` (accordion: `<details>`/`<summary>` native elements — no new dependency needed for basic expand/collapse).
7. Run test, confirm it passes.
8. Implement `src/app/[locale]/blog/[slug]/page.tsx` — for `locale === 'zh'`, `notFound()`. Query the article by `(locale, slug)` where `status = 'published'`; if not found, `notFound()`. Render: H1, meta row (date, `computeReadingTime(body)`, tags), `QuickAnswerBox`, `react-markdown` body, `FaqAccordion`, WhatsApp CTA (`WHATSAPP_URL` from constants). Emit both JSON-LD blocks via `<script type="application/ld+json">{JSON.stringify(...)}</script>` in the page (not layout, so it's per-article).
9. Modify `src/app/sitemap.ts` — after the existing static locale entries, query all published articles' `(locale, slug, updatedAt)` and append one sitemap entry per article per available locale (`id`/`en` only).
10. Manual verification: `npm run dev`, visit a published article, view page source, confirm two `<script type="application/ld+json">` blocks are present and valid JSON (paste into Google's Rich Results Test), confirm quick-answer box renders above the fold, confirm `/sitemap.xml` includes the article URL.
11. Commit: "feat: add public blog article page with JSON-LD + sitemap"

**Verification:**
- [ ] `tsc --noEmit` passes
- [ ] `blogJsonld.test.ts` and `QuickAnswerBox.test.tsx` pass
- [ ] Manual: JSON-LD validates in Google Rich Results Test, sitemap includes article URLs, unpublished/draft slugs return 404
- [ ] No placeholder/TODO comments

---

## Execution Handoff

Ready to start Phase 1? I'll use `gaspol-execute` to implement with per-phase checkpoints, or `gaspol-parallel` isn't a fit here — phases are sequential (each builds on the DB schema and reuses helpers from earlier phases), not independent.