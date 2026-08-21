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

Env vars (`.env.local`, gitignored; `.env.example` documents keys): `DATABASE_URL`, `SESSION_SECRET`, `SNAPGEN_API_KEY`, `FIRECRAWL_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`.

## Architecture

- **Public site**: `src/app/[locale]/` — `page.tsx` (landing sections: Hero, Layanan, Portfolio, TentangKami, KlienKami, Testimoni, BlogSection teaser, Kontak, FloatingWA), `blog/page.tsx` (index), `blog/[slug]/page.tsx` (article + JSON-LD).
- **Admin CMS**: `src/app/admin/` — `page.tsx` (list), `new/page.tsx` (create draft), `[id]/page.tsx` + `[id]/EditForm.tsx` (edit/review/publish), `login/`. All mutations go through `src/app/admin/actions.ts` (`'use server'`), every action starts with the file-local `requireUser()` (cookie session check, throws `'Unauthorized'`).
- **Auth**: custom, not a library. `src/lib/auth/session.ts` — HMAC-SHA256 session tokens via Web Crypto (Edge-runtime-safe, used from `middleware.ts`). `src/lib/auth/password.ts` — password hashing. `src/middleware.ts` gates `/admin/*` (redirects to `/admin/login` if no valid session) and separately runs next-intl's locale middleware for everything else, plus a Cloudflare-tunnel-specific `cf-ipcountry` check (not `request.geo`, which is always empty behind the tunnel) to default Indonesian visitors to `id` before next-intl's own negotiation runs.
- **i18n**: `src/i18n/routing.ts` — locales `id`/`en`/`zh`, default `id`, `localePrefix: 'as-needed'`. Blog content is **only `id`/`en`** — `zh` blog routes return `notFound()`. Messages in `src/messages/{id,en,zh}.json`.
- **DB**: `src/lib/db/schema.ts` (Drizzle, Postgres). Tables: `articles` (status/tags/coverImageUrl/publishedAt), `article_translations` (locale-scoped title/body/quickAnswer/metaDescription/faq, unique on `(locale, slug)` and `(articleId, locale)`), `topics` (keyword discovery queue — `status: new/used/dismissed`, populated + consumed by `scripts/daily-article.js`, see below), `admin_users`. Client: `src/lib/db/client.ts` (`drizzle(postgres(DATABASE_URL))`).
- **Design tokens** (`tailwind.config.ts`): `accent #26A1B0` / `accent-hover #1D8898`, `bg-dark #0C1A1D`, `bg-section #EFF7F8`, `border #C8E4E8`, `text-muted #607A80`, `text-on-dark #FFFFFF`, `wa-green #25D366`. Fonts: `font-serif` (Cormorant, headings), `font-sans` (Plus Jakarta Sans, body). No CSS-in-JS — Tailwind utility classes only.

## Article image generation (snapgen.ai)

- `src/lib/images/sections.ts` — pure: `splitSections`/`qualifyingSections`/`insertImageAfterSection` (positional-offset based, not text-replace — duplicate headings don't collide) + `buildSectionImagePrompt`/`buildCoverPrompt`.
- `src/lib/images/snapgen.ts` — `generateImage(apiKey, {prompt, aspect_ratio}, pollConfig?)`: POST `/generate_image`, polls `/history/{uuid}` until done. Model fixed to `nano-banana-pro` (free tier), style fixed to `Photorealistic`.
- Server actions (`src/app/admin/actions.ts`): `generateCoverImage`/`generateBodySectionImage` (call snapgen), `updateCoverImage` (persists immediately — not deferred to the save button), `createDraftArticle` accepts optional `coverImageUrl`.
- UI: `src/components/admin/CoverImageField.tsx` (prompt textarea + preview; tracks a live `initialPrompt` via `useEffect` until the admin edits it manually — a mount-only `useState` would leave auto-suggest permanently blank) and `GenerateImagesButton.tsx` (one click walks all qualifying `## ` sections, inserts `![heading](url)` after each). Both take callback props (`onGenerate`/`onGenerated`/`onBodyChange`) — decoupled from server actions for testability. Both also report in-flight state via `onRunningChange`/`onGeneratingChange` (generation takes up to ~60s): `new/page.tsx` gates its Submit button on this (submitting mid-generation would `router.push` away and silently discard the result) and makes the Body textarea read-only while running (a concurrent edit would get clobbered by the next image insert); `EditForm.tsx` only needs the read-only-textarea half — it persists the cover independently via `updateCoverImage` and never navigates away, so nothing can be orphaned there.
- `src/lib/images/storage.ts` — `persistImageLocally(url)`: downloads a (temporary, signed) snapgen.ai URL and re-hosts it under `public/uploads/<uuid>.<ext>`, returning the local `/uploads/...` path stored in the DB instead. **Required**: snapgen.ai's returned URLs are signed and expire (~7 days) — storing them directly breaks images after a week. `generateCoverImage`/`generateBodySectionImage` in `actions.ts` call this after `generateImage()`. The `web` service's container filesystem is otherwise ephemeral across redeploys, so `docker-compose.prod.yml` mounts a named volume at `/app/public/uploads`.
- **`output: 'standalone'` does NOT serve new `public/` files at request time** — contrary to what you'd expect, Next's standalone `server.js` only serves files that existed under `public/` when the process **started**; anything written later (by an admin generating images, or by `scripts/daily-article.js`'s cron run) 404s until the container restarts. Confirmed by testing: a file written to the volume-mounted `public/uploads/` after `node server.js` started returned 404 until `docker restart`. Fixed by `src/app/uploads/[...path]/route.ts` — a route handler that reads straight from disk on every request (via `src/lib/images/resolveUploadPath.ts`, path-traversal-safe), so it doesn't depend on Next's startup-time public-folder snapshot. Coexists fine with the static `public/uploads` handler (that one still serves whatever existed at startup; anything it misses falls through to this route).
- `scripts/generate-article-images.js` is a standalone CommonJS backfill script (plain `node`, not part of the Next bundle) — deliberately does **not** import `src/lib/images/*` (no `tsx`/`ts-node` dep in this project to bridge CJS→TS); it duplicates `persistImageLocally`'s logic inline instead.

## Daily trending article generator

- `scripts/daily-article.js` — standalone CJS cron script (same divergence as `generate-article-images.js`: no `src/` imports, duplicates the small logic it needs inline). Runs twice daily (06:00 and 16:00 WIB via Docker `cron` service, see below) — each run picks and consumes one `status: 'new'` topic, so two runs a day means two articles a day:
  1. Searches Firecrawl (`POST https://api.firecrawl.dev/v1/search`, `FIRECRAWL_API_KEY`) for trending interior-design keywords, dedupes against existing `topics.keyword` (case-insensitive — logic mirrors `src/lib/topics/dedupe.ts`), inserts new rows with `source: 'firecrawl'`, `status: 'new'`.
  2. Picks the oldest `status: 'new'` topic. None found → logs and exits 0 (not an error).
  3. Generates the article text by shelling out to headless Claude Code CLI: `claude -p --output-format json` with the prompt piped via **stdin** (not argv — avoids shell-escaping a long LLM prompt). The prompt template lives in `src/lib/articleGen/buildPrompt.ts` (`buildArticlePrompt`, duplicated inline in the script). **The CLI's `--output-format json` returns an envelope object — the actual response text is in `.result` and needs a second `JSON.parse` (with `src/lib/cli/extractJson.ts`'s wrapper-stripping fallback if the model adds surrounding text).**
  4. Generates cover (16:9) + one body image for **every** qualifying `## ` section **per locale** via the existing snapgen.ai pattern (`generateImage`/`persistImageLocally`, duplicated inline) — reuses `src/lib/images/sections.ts`'s section-splitting logic to find qualifying sections per locale independently, so the LLM never has to echo back exact heading text for a marker match.
  5. Inserts the article (`status: 'in_review'` — **not** auto-published, needs admin review) + both translations **inside a single `sql.begin()` transaction** (a partial insert — e.g. one translation violating a NOT NULL column — must not leave an orphaned `articles` row).
  6. Marks the topic `status: 'used'` **only after** the transaction commits — any earlier failure leaves it `'new'` for tomorrow's retry.
  - Slugs go through `uniqueSlug()` (`src/lib/blog/slug.ts`, extends `generateSlug`) to auto-suffix `-2`/`-3` on collision.
  - On Windows, spawning `claude` needs `claude.cmd` + `shell: true` (platform-conditional in the script) — irrelevant in prod, where the Alpine container has a plain `claude` binary on PATH.
- **Docker**: `Dockerfile` has a `cron` stage (separate from the lean `runner` web image) — full `node_modules`, `@anthropic-ai/claude-code` installed globally, `TZ=Asia/Jakarta` + `tzdata` (container defaults to UTC otherwise), busybox `crond` running `node scripts/daily-article.js` at `0 6,16 * * *` (06:00 and 16:00 WIB). `docker-compose.prod.yml` (gitignored) has a matching `cron` service sharing the `kionix_uploads` volume with `web` (so cron-written images are immediately servable) and requires `CLAUDE_CODE_OAUTH_TOKEN` set on the server (not committed anywhere, must be added manually before this ships).
- **Auth for headless `claude -p`**: uses the Claude Pro/Max subscription, not a pay-per-token Console API key. Generate the token once via `claude setup-token` (interactive, needs a real TTY — run it from a normal terminal, not a sandboxed/non-interactive shell) or `claude auth login --claudeai`, then set the resulting value as `CLAUDE_CODE_OAUTH_TOKEN` wherever the CLI runs headless. `ANTHROPIC_API_KEY` would also work but bills per-token against Console credits instead of the subscription — deliberately not used here.
- Design doc: `docs/plans/2026-08-20-daily-trending-article.md`.

## Non-obvious gotchas

- **Multi-stage `Dockerfile` + a compose service with no explicit `target:`** builds the **last** stage defined, not necessarily the one you mean. `docker-compose.prod.yml`'s `web` service originally had no `target:` and implicitly built `runner` (the only stage after `builder`) — this broke silently when the `cron` stage was appended after `runner`: `web` started building/running `cron`'s image (i.e. the `web` container's PID 1 became `crond`, not `next-server`, and the site went down) until `target: runner` was added explicitly. **Every service's `build:` block in a multi-stage Dockerfile must name its `target:` explicitly** — never rely on "last stage wins".
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
- `docs/plans/2026-08-20-daily-trending-article.md` — daily trending article generator (Firecrawl + Claude CLI + snapgen, Docker cron)
