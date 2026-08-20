# Daily Trending Article Generator

> **For Claude:** REQUIRED SKILL: Use gaspol-execute to implement this plan.
> **CRITICAL:** This plan specifies real integrations. During execution,
> NEVER substitute placeholders for real data sources without explicit
> user approval. If a data source doesn't exist yet, STOP and ask.
> **Progress ledger — HARD PER-PHASE GATE:** `.gaspol/progress/daily-trending-article.md`. After EACH phase and **BEFORE** starting the next, STOP and append that phase's line — status `done` + the exact command you ran and its result. Update ONLY this file, never the shared `.gaspol/progress.md`.
> **Self-contained:** every file path, contract, and env var this plan needs is written here verbatim.

## Design

### Problem

Blog butuh konten baru rutin tanpa admin harus manual riset topik + nulis + generate gambar tiap hari. `topics` table di schema sudah ada (`source`, `score`, `status: new/used/dismissed`) tapi belum ada pipeline yang mengisi/memakainya (dicatat di CLAUDE.md).

### Decisions (dari brainstorm dialog)

| Keputusan | Pilihan |
|---|---|
| Status artikel hasil generate | `in_review` (bukan auto-publish, bukan `draft`) — admin review lewat CMS existing sebelum publish |
| Sumber topik | Firecrawl real search (`FIRECRAWL_API_KEY = fc-69cd6fa496324360800bbfedef0fd5f8`), bukan list statis |
| Generator teks artikel | Claude Code CLI headless (`claude -p`), diinstall di server, bukan API key Anthropic langsung dipanggil manual |
| Lokasi eksekusi | Server produksi (dalam Docker network — DB tidak expose port ke luar), bukan laptop |
| Locale | id + en sekaligus, konsisten dengan artikel existing |
| Jadwal | 06:00 WIB tiap hari |

### Alur

```
Firecrawl /v1/search ("tren desain interior Indonesia/Batam ...")
  → insert keyword baru ke `topics` (status: new, source: 'firecrawl'), dedupe by keyword
  → pilih 1 topic status='new' terlama (discovered_at asc)
  → build prompt → jalankan `claude -p "<prompt>"` (headless, ANTHROPIC_API_KEY di env)
  → parse JSON output (title/body/quickAnswer/metaDescription/faq id+en
     + coverImagePrompt + sectionImages[{afterHeadingId, afterHeadingEn, prompt}])
  → generate cover image (snapgen, 16:9) → persistImageLocally()
  → generate 2 body image (snapgen, 4:3) → persistImageLocally()
     → insert markdown `![alt](url)` sebelum heading yang ditunjuk, di body id & en
  → insert articles (status: in_review, tags, coverImageUrl)
  → insert article_translations id + en (slug via generateSlug(), auto-suffix kalau collide)
  → update topics set status='used' where id = <topic terpilih>
```

Script **tidak** lewat server action `createDraftArticle` (butuh cookie-session, tidak ada di cron) — insert langsung via `postgres` client, pola sama seperti `scripts/generate-article-images.js`.

### Prompt Contract (Claude CLI)

`claude -p "<prompt>" --output-format json` (cek flag exact version CLI saat implementasi), prompt minta Claude balikin **hanya JSON mentah**:

```json
{
  "tags": ["kitchen-set"],
  "coverImagePrompt": "photorealistic, ...",
  "sectionImages": [
    { "afterHeadingId": "## 2. ...", "afterHeadingEn": "## 2. ...", "prompt": "..." },
    { "afterHeadingId": "## 4. ...", "afterHeadingEn": "## 4. ...", "prompt": "..." }
  ],
  "id": { "title": "...", "quickAnswer": "...", "body": "...markdown, 4-6 `## ` sections...", "metaDescription": "...", "faq": [{"q":"...","a":"..."}] },
  "en": { "title": "...", "quickAnswer": "...", "body": "...", "metaDescription": "...", "faq": [...] }
}
```

System context dalam prompt: brand Kionix Interior, target Batam/iklim tropis, gaya nulis konsisten sama artikel existing (contoh artikel di-embed sebagai referensi gaya), CTA WhatsApp di akhir body (pola existing).

Parsing: `JSON.parse(stdout.trim())`; fallback strip apapun sebelum `{` pertama / sesudah `}` terakhir kalau CLI nambah teks pembungkus, baru parse ulang. Gagal parse → exit non-zero, topic **tidak** ditandai `used`.

### Docker / Cron Wiring

Runner image produksi (`Dockerfile` stage `runner`) sengaja minimal (`.next/standalone` doang) — jangan digemukin. Tambah stage baru terpisah:

```dockerfile
FROM node:20-alpine AS cron
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta
RUN npm install -g @anthropic-ai/claude-code
RUN echo "0 6 * * * cd /app && node scripts/daily-article.js >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
CMD ["crond", "-f", "-l", "2"]
```

`docker-compose.prod.yml` service baru `cron`: build target `cron`, env sama dengan `web` (`DATABASE_URL`, `SNAPGEN_API_KEY`) + `FIRECRAWL_API_KEY` + `ANTHROPIC_API_KEY` baru, volume `kionix_uploads` yang sama (shared dengan `web` biar gambar yang ditulis cron langsung servable).

`TZ=Asia/Jakarta` + `tzdata` supaya crontab `0 6 * * *` beneran jam 06:00 WIB, bukan UTC.

### Data Integration Map

| Bagian | Sumber Data | Existing? | Catatan |
|---|---|---|---|
| Trending topic | Firecrawl `/v1/search` REST API | Baru | `FIRECRAWL_API_KEY` |
| Topic queue | tabel `topics` | Schema ada, belum dipakai | first real usage |
| Teks artikel id+en | Claude Code CLI headless | Baru | `ANTHROPIC_API_KEY` server |
| Cover + body image | snapgen.ai `generateImage()` pattern | Ada (`generate-article-images.js`) | reuse |
| Re-host gambar | `persistImageLocally` pattern | Ada | reuse, volume `kionix_uploads` |
| Insert artikel | `db.insert(articles/articleTranslations)` | Tabel ada | insert langsung via `postgres`, bukan server action |

### Error Handling

- Firecrawl gagal/no result → log, skip hari itu, topics lama tetap ada buat besok
- Claude CLI gagal / output bukan JSON valid → exit non-zero, topic **tidak** ditandai `used`, log stderr lengkap
- snapgen gagal/timeout → sama: topic tidak `used`, artikel tidak diinsert (all-or-nothing per run)
- Slug collision → auto-suffix `-2`, `-3`, dst.
- Semua log ke stdout container (`docker logs <cron-container>`)

### Out of scope (YAGNI)

- Auto-publish (butuh review manual dulu)
- UI admin buat lihat/kelola `topics` queue langsung (bisa ditambah nanti kalau perlu)
- Retry/backoff otomatis dalam 1 run (kalau gagal, coba lagi besok pagi)
- Multi-artikel per hari (1 artikel/hari sesuai request)

## Implementation Plan

### Goal

Ship a script + Docker cron service that, every morning at 06:00 WIB, finds a trending interior-design topic (Firecrawl), writes a full bilingual (id+en) article with cover + 2 body images (Claude CLI headless + snapgen.ai, reusing existing image-gen patterns), and inserts it as an `in_review` article ready for admin review/publish.

### Architecture Context (from CLAUDE.md)

- DB: Drizzle ORM (`src/lib/db/schema.ts`) — `articles`, `article_translations`, `topics` (schema exists, unused until this feature), `db` client at `src/lib/db/client.ts`.
- Image gen precedent: `src/lib/images/sections.ts` (`splitSections`/`qualifyingSections`/`insertImageAfterSection` — **positional-offset based**, safe against duplicate headings; `buildSectionImagePrompt(heading)`/`buildCoverPrompt(title, quickAnswer)`), `src/lib/images/snapgen.ts` (`generateImage(apiKey, {prompt, aspect_ratio}, pollConfig?)`), `src/lib/images/storage.ts` (`persistImageLocally(url)`).
- Standalone script precedent: `scripts/generate-article-images.js` — plain CJS, `require('postgres')` directly (not Drizzle), loads `.env.local` via `process.loadEnvFile`, duplicates `persistImageLocally` inline (documented divergence: no tsx/ts-node bridge for CJS→TS in this repo).
- Slug: `src/lib/blog/slug.ts` — `generateSlug(title)`.
- Docker: multi-stage `Dockerfile` (`deps` → `builder` → `runner`), `runner` intentionally minimal (standalone output only, no full `node_modules`/scripts). `docker-compose.prod.yml` — gitignored, real secrets, lives on the server; `web` + `postgres` services, `kionix_uploads` named volume mounted into `web` at `/app/public/uploads`.
- Env vars: `.env.local` (gitignored), `.env.example` documents keys — currently `DATABASE_URL`, `SESSION_SECRET`, `SNAPGEN_API_KEY`.
- Testing: Jest + Testing Library, `@/*` → `src/*`. Pure logic in small `src/lib/**` files gets full unit coverage. `scripts/*.js` are **not** part of the Jest suite (plain CJS, not TS, not under `src/`) — this plan keeps that convention: all branching/parsing logic that CAN be pure goes into tested `src/lib/**.ts` modules; `scripts/daily-article.js` stays thin glue that imports nothing from `src/` (same reason as the existing script) and is verified by an actual run against the dev DB, not a Jest mock.

### Tech Stack / New Dependencies

- Firecrawl REST API (`https://api.firecrawl.dev/v1/search`, `Authorization: Bearer <FIRECRAWL_API_KEY>`) — plain `fetch`, no new npm package.
- Claude Code CLI (`@anthropic-ai/claude-code`), invoked headless: `claude -p "<prompt>" --output-format json` via Node `child_process.execFileSync` — **verify exact flag name against the installed CLI version during Phase 5** (ponytail: don't hardcode a guessed flag without checking `claude --help` first).
- No new runtime npm deps for the Next.js app itself — `postgres` package already a dependency (used by `scripts/generate-article-images.js`).

### Data Integration Map

| Feature | Data Source | Exists? | Action |
|---|---|---|---|
| Trending topic candidates | Firecrawl `/v1/search` REST API | No | New `fetch` call in script, real HTTP, no mock |
| Topic queue read/write | `topics` table via raw `postgres` client | Table exists, unused | Real insert/select/update in script |
| Keyword dedupe logic | `src/lib/topics/dedupe.ts` (new) | No | Pure fn, real unit tests |
| Claude CLI JSON parse fallback | `src/lib/cli/extractJson.ts` (new) | No | Pure fn, real unit tests |
| Article prompt string | `src/lib/articleGen/buildPrompt.ts` (new) | No | Pure fn, real unit tests |
| Slug collision handling | `src/lib/blog/slug.ts` (extend) | `generateSlug` exists | Add `uniqueSlug`, real unit tests |
| Body image insertion | `src/lib/images/sections.ts` | Exists, tested | Reuse pattern (duplicated inline in CJS script, same as `persistImageLocally`) |
| Image generation + persist | `src/lib/images/snapgen.ts` + `storage.ts` pattern | Exists | Reuse pattern (duplicated inline, same as existing script) |
| Article + translations insert | `articles`/`article_translations` tables via raw `postgres` | Tables exist | Real insert in script, status `in_review` |
| Cron scheduling | New Dockerfile stage + compose service | No | Real `crond`, no placeholder timer |

### Phase 1: Topic keyword dedupe (pure logic)

**Estimated time:** 5 min

**Files:**
- Create: `src/lib/topics/dedupe.ts`
- Test: `src/__tests__/topicsDedupe.test.ts`

**Steps:**
1. Write failing test for `filterNewKeywords` in `src/__tests__/topicsDedupe.test.ts`: given `candidates = ['Warna Cat Tropis', 'kitchen set minimalis']` and `existingKeywords = ['kitchen set minimalis']`, expect result `['Warna Cat Tropis']` (case-insensitive match dropped). Expected error: `ReferenceError: filterNewKeywords is not defined`.
2. Run `npx jest topicsDedupe`, confirm it fails for that reason.
3. Implement in `src/lib/topics/dedupe.ts`:
   ```ts
   export function filterNewKeywords(candidates: string[], existingKeywords: string[]): string[] {
     const existing = new Set(existingKeywords.map((k) => k.trim().toLowerCase()))
     const seen = new Set<string>()
     return candidates.filter((c) => {
       const key = c.trim().toLowerCase()
       if (!key || existing.has(key) || seen.has(key)) return false
       seen.add(key)
       return true
     })
   }
   ```
4. Run `npx jest topicsDedupe`, confirm pass (add a second test case for within-batch duplicates).
5. Commit: "feat: add topic keyword dedupe helper"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest topicsDedupe` passes
- [ ] No placeholder/TODO comments
- [ ] Case-insensitive dedupe against both existing DB keywords and within-batch duplicates confirmed by test

### Phase 2: Claude CLI JSON extraction fallback (pure logic)

**Estimated time:** 5 min

**Files:**
- Create: `src/lib/cli/extractJson.ts`
- Test: `src/__tests__/extractJson.test.ts`

**Steps:**
1. Write failing test for `extractJsonObject`: given raw string `'Here is the result:\n{"a":1}\nHope that helps!'`, expect `extractJsonObject(raw)` to return `'{"a":1}'`. Expected error: `ReferenceError: extractJsonObject is not defined`.
2. Run `npx jest extractJson`, confirm failure.
3. Implement in `src/lib/cli/extractJson.ts`:
   ```ts
   export function extractJsonObject(raw: string): string {
     const start = raw.indexOf('{')
     const end = raw.lastIndexOf('}')
     if (start === -1 || end === -1 || end < start) {
       throw new Error('no JSON object found in CLI output')
     }
     return raw.slice(start, end + 1)
   }
   ```
4. Run tests, confirm pass. Add a case for clean JSON with no wrapper text (passthrough), and a case with no `{`/`}` at all (throws).
5. Commit: "feat: add Claude CLI JSON extraction fallback"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest extractJson` passes (3 cases: wrapped, clean, throws)
- [ ] No placeholder/TODO comments

### Phase 3: Unique slug helper (pure logic)

**Estimated time:** 5 min

**Files:**
- Modify: `src/lib/blog/slug.ts`
- Modify: `src/__tests__/blogSlug.test.ts` (existing file, append tests)

**Steps:**
1. Write failing test in `src/__tests__/blogSlug.test.ts` for `uniqueSlug`: given `base = 'kitchen-set'` and `existingSlugs = ['kitchen-set', 'kitchen-set-2']`, expect `uniqueSlug(base, existingSlugs)` to return `'kitchen-set-3'`; given no collision, expect `uniqueSlug('foo', [])` to return `'foo'`. Expected error: `ReferenceError: uniqueSlug is not defined`.
2. Run `npx jest blogSlug`, confirm failure.
3. Implement in `src/lib/blog/slug.ts`:
   ```ts
   export function uniqueSlug(base: string, existingSlugs: string[]): string {
     const taken = new Set(existingSlugs)
     if (!taken.has(base)) return base
     let i = 2
     while (taken.has(`${base}-${i}`)) i++
     return `${base}-${i}`
   }
   ```
4. Run tests, confirm pass.
5. Commit: "feat: add uniqueSlug collision helper"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest blogSlug` passes (existing + 2 new cases)
- [ ] No placeholder/TODO comments

### Phase 4: Article prompt builder (pure logic)

**Estimated time:** 10 min

**Files:**
- Create: `src/lib/articleGen/buildPrompt.ts`
- Test: `src/__tests__/buildArticlePrompt.test.ts`

**Steps:**
1. Write failing test for `buildArticlePrompt(topic: string)`: assert the returned string contains the topic keyword, and the JSON key names `'"id"'`, `'"en"'`, `'"tags"'`, `'"faq"'` (contract markers the parser depends on). Expected error: `ReferenceError: buildArticlePrompt is not defined`.
2. Run `npx jest buildArticlePrompt`, confirm failure.
3. Implement in `src/lib/articleGen/buildPrompt.ts` — a template literal function embedding: brand/context (Kionix Interior, Batam, iklim tropis), instruction to output **only raw JSON** matching:
   ```json
   {
     "tags": ["..."],
     "id": { "title": "...", "quickAnswer": "...", "body": "...markdown, 4-6 `## ` sections, CTA WhatsApp di akhir...", "metaDescription": "...", "faq": [{"q":"...","a":"..."}] },
     "en": { "title": "...", "quickAnswer": "...", "body": "...", "metaDescription": "...", "faq": [...] }
   }
   ```
   (No `coverImagePrompt`/`sectionImages` fields — those are derived locally from the generated body via `buildCoverPrompt`/`buildSectionImagePrompt`/`qualifyingSections`, reusing `src/lib/images/sections.ts`, so the LLM never has to echo back exact heading strings for a marker match. This **supersedes** the `## Prompt Contract` shown in the Design section above, discovered while re-reading CLAUDE.md's existing image-gen pattern during planning — simpler and removes a fragile LLM-echo dependency.)
   Interpolate `topic` into the prompt as the required subject.
4. Run tests, confirm pass.
5. Commit: "feat: add article generation prompt builder"

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest buildArticlePrompt` passes
- [ ] Prompt asserts on contract markers the JSON parser depends on (not just topic substring)
- [ ] No placeholder/TODO comments

### Phase 5: `scripts/daily-article.js` — the glue script

**Estimated time:** 15 min (largest phase — glue/orchestration, not unit-testable per project convention; see note below)

**Files:**
- Create: `scripts/daily-article.js`
- Modify: `.env.example` (document `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY`)
- Modify: `.env.local` (add real `FIRECRAWL_API_KEY=fc-69cd6fa496324360800bbfedef0fd5f8` — gitignored, safe)

**ponytail:** this phase is exempt from the Jest TDD gate — `scripts/*.js` are plain CJS, not part of the Jest module graph (established by `scripts/generate-article-images.js`, which has zero test coverage and is verified by running it for real). All extractable branching/parsing logic already has real unit tests in Phases 1–4. This script is thin orchestration: HTTP call → CLI subprocess → HTTP calls → DB writes, in a fixed sequence. Upgrade path if this script grows real branching logic of its own: extract that logic into another tested `src/lib/**` module, same pattern as Phases 1–4.

**Steps:**
1. Run `claude --help` (Bash) to confirm the exact non-interactive/headless flag and JSON-output flag name for the installed CLI version — do not guess.
2. Write `scripts/daily-article.js` (CJS, `require`, `.env.local` loader — copy the header pattern verbatim from `scripts/generate-article-images.js` lines 1–11), implementing in order:
   - `searchTrendingTopics()`: `fetch('https://api.firecrawl.dev/v1/search', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.FIRECRAWL_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'tren desain interior rumah Indonesia Batam 2026', limit: 10 }) })`. Extract candidate keyword strings from result titles. Throw with the response body text on non-OK status (matches existing script's error style).
   - Dedupe: `select keyword from topics`, inline the same case-insensitive filter as `src/lib/topics/dedupe.ts` (duplicated logic, ponytail: same divergence as `persistImageLocally`), insert new rows `insert into topics (keyword, source, status) values (..., 'firecrawl', 'new')` for each surviving candidate.
   - Pick topic: `select * from topics where status = 'new' order by discovered_at asc limit 1`. If none, `console.log('No new topic today.'); return` (exit 0, not an error).
   - Build prompt: inline the same template as `src/lib/articleGen/buildPrompt.ts` (duplicated), call `claude` via `execFileSync('claude', [...flags from step 1], { maxBuffer: 10 * 1024 * 1024, env: process.env })`.
   - Parse: `JSON.parse(stdout)`, on throw retry with the same extraction logic as `src/lib/cli/extractJson.ts` (duplicated) before giving up and exiting non-zero (topic stays `new`).
   - Cover image: inline `buildCoverPrompt(id.title, id.quickAnswer)` logic (duplicated from `sections.ts`), call snapgen `generate_image` + poll `history/{uuid}` (copy the `generateImage`/`pollUntilDone` functions verbatim from `scripts/generate-article-images.js` lines 44–74), then `persistImageLocally` (copy verbatim from lines 80–98).
   - Body images: for **each locale** (`id`, `en`) independently — `splitSections`/`qualifyingSections`/`insertImageAfterSection` logic (duplicated inline from `sections.ts`) on that locale's `body`, take the first 2 qualifying sections, generate a 4:3 image per section via `buildSectionImagePrompt(section.heading)`, insert via `insertImageAfterSection`. (Each locale's sections are found independently by heading text in its own body — no cross-locale marker matching needed.)
   - Slug: `select slug from article_translations where locale = $1`, compute `uniqueSlug(generateSlug(title), existingSlugs)` (inline duplicated logic) per locale.
   - Insert: `insert into articles (status, tags, cover_image_url) values ('in_review', ..., ...) returning id`, then `insert into article_translations (...)` for id + en.
   - Mark used: `update topics set status = 'used' where id = $1` — **only after** the article insert succeeds.
   - Wrap the whole body-generation-through-insert sequence in a try/catch that logs and `process.exit(1)` on any failure, leaving the topic `new` for retry (per the Error Handling section above).
3. Run manually against the **dev** DB: `node scripts/daily-article.js` (uses `.env.local`'s `DATABASE_URL`/`SNAPGEN_API_KEY`/`FIRECRAWL_API_KEY`).
4. Confirm in DB: a new `articles` row with `status = 'in_review'`, non-null `cover_image_url`, and both `id`/`en` `article_translations` rows with `body` containing `![...](...)` markdown for 2 images each.
5. Confirm in admin CMS (`/admin`, logged in) that the new article appears and renders correctly in the edit view.
6. Commit: "feat: add daily trending article generator script"

**Verification:**
- [ ] `npx tsc --noEmit` passes (script itself is untyped CJS, but doesn't break the TS build)
- [ ] Real run against dev DB produces one `in_review` article with cover + 2×2 body images (id+en), confirmed via DB query and admin UI
- [ ] A second run with no new Firecrawl results (or all topics already `used`) exits 0 with `"No new topic today."`, no crash
- [ ] A forced failure (e.g. temporarily wrong `ANTHROPIC_API_KEY`) leaves the picked topic `status = 'new'`, not `used`
- [ ] No placeholder/TODO comments; no hardcoded fake image URLs

### Phase 6: Docker cron service

**Estimated time:** 10 min

**Files:**
- Modify: `Dockerfile` (new `cron` stage)
- Modify: `docker-compose.prod.yml` (new `cron` service — gitignored, edit the live file directly)
- Modify: `.env.example`

**Steps:**
1. Confirm current state: `docker compose -f docker-compose.prod.yml config --services` does not list `cron` yet.
2. Append to `Dockerfile`:
   ```dockerfile
   FROM node:20-alpine AS cron
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN apk add --no-cache tzdata
   ENV TZ=Asia/Jakarta
   RUN npm install -g @anthropic-ai/claude-code
   RUN echo "0 6 * * * cd /app && node scripts/daily-article.js >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
   CMD ["crond", "-f", "-l", "2"]
   ```
3. Add to `docker-compose.prod.yml`:
   ```yaml
     cron:
       build:
         context: .
         network: host
         target: cron
       restart: unless-stopped
       depends_on:
         - postgres
       environment:
         - DATABASE_URL=postgresql://kionix:z7zJNXBBZC-PACM33Bt3ThlA@postgres:5432/kionix
         - SNAPGEN_API_KEY=geminiai-3e525d7563fa95de17e2f9375afde252
         - FIRECRAWL_API_KEY=fc-69cd6fa496324360800bbfedef0fd5f8
         - ANTHROPIC_API_KEY=<user must fill in before deploy>
       volumes:
         - kionix_uploads:/app/public/uploads
   ```
   (values copied verbatim from the existing `web` service in the same file for `DATABASE_URL`/`SNAPGEN_API_KEY` — keep them in sync if they ever rotate.)
4. Add `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY` to `.env.example` (placeholder values, this file IS committed).
5. Run `docker compose -f docker-compose.prod.yml config --services`, confirm `cron` is listed.
6. Run `docker compose -f docker-compose.prod.yml build cron`, confirm it builds successfully (validates the new stage compiles, `claude` CLI installs).
7. Commit: "feat: add cron service for daily article generation" (note: `docker-compose.prod.yml` is gitignored — this commit only includes `Dockerfile` + `.env.example`; tell the user to edit their server's `docker-compose.prod.yml` copy directly with the same block since git can't track it).

**Verification:**
- [ ] `docker compose -f docker-compose.prod.yml config --services` lists `cron`
- [ ] `docker compose -f docker-compose.prod.yml build cron` succeeds
- [ ] `docker compose -f docker-compose.prod.yml run --rm cron node scripts/daily-article.js` runs the script successfully inside the built image (real smoke test, hits real DB/APIs)
- [ ] `docker compose -f docker-compose.prod.yml run --rm cron date` shows WIB time (TZ confirmed)
- [ ] User has set a real `ANTHROPIC_API_KEY` on the server before this ships (flag if missing — do not fabricate one)

### Phase 7: Docs sync

**Estimated time:** 5 min

**Files:**
- Modify: `CLAUDE.md`

**Steps:**
1. Add a new subsection under "Article image generation (snapgen.ai)" or its own heading, documenting: `scripts/daily-article.js` (what it does, cron schedule, env vars `FIRECRAWL_API_KEY`/`ANTHROPIC_API_KEY`), that `topics` table is now actively used (source `'firecrawl'`, status lifecycle `new`→`used`), and the new Docker `cron` service + stage.
2. Add `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY` to the "Env vars" line in CLAUDE.md.
3. Commit: "docs: document daily trending article pipeline in CLAUDE.md"

**Verification:**
- [ ] CLAUDE.md accurately reflects the new script, table usage, and Docker service (matches gaspol-sync-docs conventions — this is "what/where", not "why")

## Red Flag Self-Check

- Data Integration Map: present, all rows real (no placeholders)
- Every phase has Verification block: yes
- Phases 1-4 have proper TDD Step 1 template: yes
- Phase 5 deliberately exempted from Jest (documented `ponytail:` reason, matches existing project convention for `scripts/*.js`) — real-DB run is its verification instead
- Phases 6-7 are infra/docs, verified by real commands not Jest — appropriate for their nature
- Self-contained: all file paths, contracts, env vars, and secrets already shared in this session are written verbatim above
- Progress ledger path declared in header: yes, `.gaspol/progress/daily-trending-article.md`
