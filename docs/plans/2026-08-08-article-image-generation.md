# Article Image Generation

## Design

### Problem

Blog posts have a `cover_image_url` column that nothing sets, and body markdown has no images at all. Posts are text-only and short. Goal: generate a cover image and per-section body images via the snapgen.ai API (key: `SNAPGEN_API_KEY`, see `.env.local`) as part of the normal admin article workflow, so every article (current and future, manual or eventually auto-generated from `topics`) ships with visuals — making posts longer and more visually engaging.

### Scope decision

This is a pipeline feature living in the existing admin CMS (`src/app/admin/new/page.tsx`, `src/app/admin/[id]/EditForm.tsx`, `src/app/admin/actions.ts`) — not a one-off script. The `topics` table has no auto-generation pipeline built yet (schema-only), so "pipeline" concretely means: the admin create/edit flow, today's only real article-creation path.

### Cover image

- One field, article-level (`articles.cover_image_url`, not per-locale).
- Prompt auto-suggested from the id-locale `title + quickAnswer`, shown in an editable textarea — admin can tweak before generating (human-in-the-loop; this is the highest-visibility image, used everywhere as thumbnail/share image).
- Fixed brand style + `16:9` aspect ratio, not exposed as a UI choice.
- "Generate Cover" → "Regenerate" once an image exists.
- Persistence: on `new/page.tsx` the article doesn't exist yet, so the URL rides along in `createDraftArticle`'s input (gains optional `coverImageUrl`). On `EditForm.tsx` the article already exists, so it persists immediately via a new `updateCoverImage(articleId, url)` action — not deferred to "Simpan Perubahan", since generation cost real API time/credits and shouldn't be lost on navigation.

### Body images

- Fully automatic placement + prompt-crafting — no per-section manual step, no LLM decision layer.
- One "Generate Images" button per locale, directly under that locale's Body textarea (body text differs per locale, so it fires per-locale).
- On click: split body markdown on `## ` headings → candidate sections. Skip trivial sections (<40 chars of content, filters bare intro/outro). **Skip sections that already have an inserted `![...]()` immediately following them** (re-run guard — clicking twice after an edit doesn't duplicate images already placed).
- For each qualifying section: prompt = `{heading} — warm tropical interior, photorealistic` (heading text is already descriptive for this listicle-style content). Fixed `4:3` aspect ratio, fixed brand style.
- Insert `![heading](url)` markdown immediately after that section's content, into the `body` state that's already wired to the textarea — no extra persistence step, saves whenever the rest of the body saves.
- Progress: button label → `Generating image {n} of {total}...`, disabled while running. Per-image failures append to a small error list (`role="alert"`) without halting remaining generations.
- Both cover and body-image actions use local `useState`, not the form's `submitting` flag — rest of the form (title, meta, FAQ, save) stays fully interactive during generation.

### Architecture / reuse

- Extract the proven poll/generate logic from `scripts/generate-article-images.js` (`generateImage` + `pollUntilDone`, POST `/generate_image` → poll `/history/{uuid}` until `status===2`) into `src/lib/images/snapgen.ts`. Both the CLI script and the new server actions call this one implementation.
- Two new server actions in `src/app/admin/actions.ts`, following the existing `'use server'` + `requireUser()` pattern:
  - `generateCoverImage(prompt)` → `aspect_ratio: '16:9'`
  - `generateBodySectionImage(prompt)` → `aspect_ratio: '4:3'`
  - `updateCoverImage(articleId, url)` → persists cover URL for an existing article
- No new npm dependency (native `fetch`/`FormData`, Node 20, same as the existing script). No new ANTHROPIC/LLM dependency — heading-based heuristic replaces an LLM "which section needs an image" decision (Approach A over Approach B, see below).

### Approaches considered

- **A — Heuristic full-auto (chosen).** Section = candidate, heading text is the prompt basis. Zero new dependencies, reuses the already-proven snapgen contract.
- **B — LLM-assisted selection.** A Claude API call reads the full body and returns `{needs_image, image_prompt}` per section — smarter selection/richer prompts, but needs a new `ANTHROPIC_API_KEY` (nothing in this codebase currently integrates an LLM), one more network hop, and JSON-parsing failure modes. Deferred: revisit if article structure becomes less uniform than the current listicle format and the heading-heuristic starts producing poor prompts.

### UI placement (Tailwind, reusing existing classes verbatim — no new visual language)

- `new/page.tsx`: Cover Image block sits beside the existing Tags field (2-col grid).
- `EditForm.tsx`: Cover Image becomes a full-width card between the locale tabs and the existing 2-column grid (no Tags field here to sit beside).
- `LocaleFieldset` (shared by both pages' locale forms): "Generate Images" button directly under the Body textarea.
- Button hierarchy matches existing convention: outline `border-accent text-accent hover:bg-bg-section` for these generative actions (secondary), solid `bg-accent` stays reserved for real submit/publish actions.
- Loading: `animate-pulse` Tailwind utility for the cover's 16:9 slot — no new spinner component.
- Errors: reuse the exact `role="alert" text-sm text-red-600` pattern already in `new/page.tsx`'s top-level submit error.
- `alt` text: cover = derived title; body-section image = the section's own heading text.

### Explicitly out of scope (v1)

- Style/aspect-ratio picker in the UI — locked server-side.
- LLM-based smart section selection (Approach B).
- `next/image` domain allowlisting for the snapgen CDN — plain `<img>` for now.
- Auto-generation triggered from the `topics` table — that pipeline doesn't exist yet; this feature only wires into the manual admin create/edit flow.

### Data Integration Map

| Component | Data Source | Existing? | Notes |
|---|---|---|---|
| Cover image generation | snapgen.ai `POST /generate_image` + `GET /history/{uuid}` | New client, proven contract | `src/lib/images/snapgen.ts` |
| Cover image persistence (new article) | `createDraftArticle` server action | Extend existing | adds optional `coverImageUrl` param |
| Cover image persistence (existing article) | new `updateCoverImage` server action | New, thin | `articles.cover_image_url` update |
| Body image generation | snapgen.ai `POST /generate_image` + `GET /history/{uuid}` | Reuse same client | `aspect_ratio: '4:3'` |
| Body image persistence | existing `body` form state → `updateArticleTranslation` / `createDraftArticle` | Existing, no change | images are just markdown in the string |
| Auth guard | `requireUser()` | Existing | reused as-is on both new actions |

---

## Implementation Plan

> **For Claude:** REQUIRED SKILL: Use gaspol-execute to implement this plan.
> **CRITICAL:** This plan specifies real integrations. During execution,
> NEVER substitute placeholders for real data sources without explicit
> user approval. If a data source doesn't exist yet, STOP and ask.
> **Progress ledger — HARD PER-PHASE GATE:** `.gaspol/progress/article-image-generation.md`. After EACH phase and **BEFORE** starting the next, STOP and append that phase's line — status `done` + the exact command you ran and its result. This is **blocking**: no next phase until the line is written. Set `doing` when a phase starts, `done` when its tests pass. **Never batch all updates at the end.** Update ONLY this file.
> **Self-contained:** this plan is the COMPLETE spec, executable with no other context. Every file path, contract, and convention is written here verbatim.

## Goal

Give every blog article a generated cover image and auto-placed body images, wired into the existing admin CMS (`src/app/admin/new/page.tsx` create flow and `src/app/admin/[id]/EditForm.tsx` edit flow) via the snapgen.ai image API, so posts stop being text-only and become longer/more visually engaging without any new manual content-authoring step.

## Architecture Context

- Stack: Next.js 14 App Router, Drizzle ORM + `postgres` client (`src/lib/db/client.ts`), Jest + Testing Library (`jest.config.ts`: `testEnvironment: jest-environment-jsdom`, tests in `src/__tests__/*.test.[jt]sx`, path alias `@/*` → `src/*`).
- `articles` table already has `cover_image_url` (`src/lib/db/schema.ts:12`, Drizzle field `coverImageUrl`) — currently nothing writes to it.
- Admin server actions live in `src/app/admin/actions.ts`, all `'use server'`, all start with `await requireUser()` (local function in that same file — cookie `SESSION_COOKIE_NAME` → `verifySessionToken(token, process.env.SESSION_SECRET!)` from `src/lib/auth/session.ts`, throws `'Unauthorized'` if no valid session). New actions in this plan call the same in-file `requireUser()`, no new auth code.
- `createDraftArticle({ tags, translations })` (actions.ts:29) inserts into `articles` then loops `translations` into `article_translations`. `updateArticleTranslation(articleId, locale, fields)` (actions.ts:61) updates one locale's row. Both patterns are extended, not replaced.
- `src/app/admin/new/page.tsx`: client component, holds `id`/`en` form state via `LocaleFieldset` (a local component defined in that same file, reused for both locales), submits via `createDraftArticle`.
- `src/app/admin/[id]/EditForm.tsx`: client component, tab-switches between `id`/`en` translations (`activeLocale` state), each locale's fields including the markdown `body` textarea are edited independently; the right-side preview pane already does `<ReactMarkdown>{current.body}</ReactMarkdown>` — inserted `![]()` images render there with zero extra wiring.
- `src/app/admin/[id]/page.tsx`: server component, `db.query.articles.findFirst({ where: eq(articles.id, id), with: { translations: true } })` — this already returns `coverImageUrl` (Drizzle returns all columns by default); only the `Article`/prop type in `EditForm.tsx` needs to include it, no query change.
- `SNAPGEN_API_KEY` is already set in `.env.local` and documented (empty) in `.env.example` (done earlier this session — not part of this plan's phases).
- Existing test-mocking precedent for a DB-backed server unit: `src/__tests__/BlogSection.test.tsx` mocks `@/lib/db/client`'s `db` with a chainable object matching the exact query-builder chain used (`select().from().innerJoin().where().orderBy().limit()`), and mocks `next-intl/server`. This plan's action tests mirror that shape for `db.insert(...).values(...).returning()` / `db.update(...).set(...).where(...)`.
- **Deliberate divergence from the brainstorm's "extract shared lib for the CLI script too":** `scripts/generate-article-images.js` is plain CommonJS (its own header comment: "not part of the Next.js app bundle") and the project has no `ts-node`/`tsx` dependency, so it cannot `require()` the new TypeScript `src/lib/images/snapgen.ts` without adding a build-step dependency solely to save ~30 duplicated lines in a one-off backfill script. `ponytail: scripts/generate-article-images.js stays as-is, untouched by this plan — add a shared runtime import only if a second plain-JS script needs the same client.`

## Tech Stack (new additions this plan introduces)

None. Native `fetch`/`FormData` (Node 20 globals, already used by `scripts/generate-article-images.js`), existing Jest + Testing Library, existing Tailwind classes. No new npm dependency.

## Data Integration Map

| Feature | Data Source | Hook/API | Exists? | Action |
|---|---|---|---|---|
| Section parsing/prompt building | body markdown string (in-memory) | `src/lib/images/sections.ts` | No | Create new (pure) |
| Image generation + polling | snapgen.ai `POST /generate_image`, `GET /history/{uuid}` | `src/lib/images/snapgen.ts` | No | Create new |
| `SNAPGEN_API_KEY` | `.env.local` | `process.env.SNAPGEN_API_KEY` | Yes (set earlier this session) | Use existing |
| Cover image generation | snapgen.ai via `src/lib/images/snapgen.ts` | new action `generateCoverImage` in `actions.ts` | No | Create new |
| Body section image generation | snapgen.ai via `src/lib/images/snapgen.ts` | new action `generateBodySectionImage` in `actions.ts` | No | Create new |
| Cover image persistence (existing article) | `articles.cover_image_url` | new action `updateCoverImage` in `actions.ts` | No | Create new |
| Cover image persistence (new article) | `articles.cover_image_url` | extend existing `createDraftArticle` | Partially (table column exists, action doesn't accept it) | Modify existing |
| Body image persistence | `article_translations.body` | existing `updateArticleTranslation` / `createDraftArticle` (body is just a string field) | Yes | Use existing, no change |
| Auth guard | `requireUser()` | `src/app/admin/actions.ts` (local fn) | Yes | Reuse as-is |
| Cover/body-image UI shell | — | new `src/components/admin/CoverImageField.tsx`, `src/components/admin/GenerateImagesButton.tsx` | No | Create new |

---

### Phase 1: Section Parsing & Prompt Pure Logic

**Estimated time:** 15 minutes

**Files:**
- Create: `src/lib/images/sections.ts`
- Test: `src/__tests__/imageSections.test.ts`

**Contract:**
```ts
export type Section = { heading: string; content: string; raw: string; hasImage: boolean }

export function splitSections(body: string): Section[]
// One entry per top-level `## ` heading block (heading text + everything until the
// next `## ` or end of string). Text before the first `## ` (intro paragraph) is not
// a section. hasImage = true if the block's content already contains a markdown
// image `![...](...)`.

export function qualifyingSections(sections: Section[]): Section[]
// Sections where hasImage === false AND content.trim().length >= 40.

export function insertImageAfterSection(body: string, section: Section, imageMarkdown: string): string
// Returns a new body string with `imageMarkdown` inserted at the end of that
// section's block (before the next heading, or at the end of the string if it's
// the last section). Must not touch any other section's text.

export function buildSectionImagePrompt(heading: string): string
// `${heading} — warm tropical interior, photorealistic`

export function buildCoverPrompt(title: string, quickAnswer: string): string
// `${title}. ${quickAnswer}` sliced to 300 chars
```

**Steps:**
1. Write failing tests for `splitSections`, `qualifyingSections`, `insertImageAfterSection`, `buildSectionImagePrompt`, `buildCoverPrompt` in `src/__tests__/imageSections.test.ts`. Expected error: `Cannot find module '@/lib/images/sections'`.
   - `splitSections`: given a 2-section body, returns 2 entries with correct `heading` text and `hasImage: false`.
   - `qualifyingSections`: filters out a section whose content is `'Short.'` (< 40 chars).
   - `qualifyingSections`: filters out a section whose content already contains `![x](http://y)`.
   - `insertImageAfterSection` + round-trip: insert an image into the first of 2 sections, then re-run `splitSections` on the result — first section now has `hasImage: true`, second section's `heading`/`content` are byte-identical to before.
   - `insertImageAfterSection` on the last section (no following heading) appends correctly and doesn't throw.
   - `buildSectionImagePrompt('Tip One')` → `'Tip One — warm tropical interior, photorealistic'`.
   - `buildCoverPrompt` truncates a long title+quickAnswer combo to 300 chars.
2. Run `npx jest imageSections`, confirm it fails for the expected reason (module not found).
3. Implement `src/lib/images/sections.ts` to satisfy every test.
4. Run `npx jest imageSections`, confirm all pass.
5. Commit: `feat: add pure section-parsing/prompt logic for article images`

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest imageSections` passes, all cases above covered
- [ ] No placeholder/TODO comments in new code
- [ ] Functions are pure (no imports of `db`, `fetch`, or `'use server'`)

---

### Phase 2: snapgen.ai API Client

**Estimated time:** 15 minutes

**Files:**
- Create: `src/lib/images/snapgen.ts`
- Test: `src/__tests__/snapgenClient.test.ts`

**Contract** (mirrors the already-working logic in `scripts/generate-article-images.js:40-69`, ported to TypeScript):
```ts
export async function generateImage(
  apiKey: string,
  opts: { prompt: string; aspect_ratio: '16:9' | '4:3' },
  pollConfig?: { pollIntervalMs?: number; maxAttempts?: number } // default 3000 / 20, injectable for tests
): Promise<string> // resolves to the generated image URL
```
- POST `https://api.snapgen.ai/uapi/v1/generate_image`, `multipart/form-data` via native `FormData`, header `x-api-key: apiKey`, fields: `prompt`, `model=nano-banana-pro`, `aspect_ratio`, `style=Photorealistic`, `resolution=1K`.
- If the POST response body's `status === 2`, return `generate_result` immediately (no poll).
- Else poll `GET https://api.snapgen.ai/uapi/v1/history/{uuid}` (same `x-api-key` header) every `pollIntervalMs` until `status === 2` (return `generate_result ?? generated_image?.[0]?.image_url`), `status === 3` (throw with `error_message`), or `maxAttempts` exceeded (throw timeout error).
- Non-2xx HTTP response at either step throws with status + response body text.

**Steps:**
1. Write failing tests in `src/__tests__/snapgenClient.test.ts`, mocking `global.fetch` with `jest.fn()`. Expected error: `Cannot find module '@/lib/images/snapgen'`.
   - POST response already `status: 2` with `generate_result: 'https://x/1.jpg'` → resolves `'https://x/1.jpg'`, `fetch` called exactly once (no poll).
   - POST response `status: 1`, first poll returns `status: 1`, second poll returns `status: 2, generate_result: 'https://x/2.jpg'` → resolves `'https://x/2.jpg'` (pass `pollIntervalMs: 0` to keep the test fast).
   - Poll response `status: 3, error_message: 'boom'` → rejects with an error whose message contains `'boom'`.
   - POST response not `ok` (e.g. `{ ok: false, status: 401, text: async () => '...' }`) → rejects, message contains `'401'`.
   - Polling never reaches `status: 2` within `maxAttempts: 2` → rejects with a timeout error.
2. Run `npx jest snapgenClient`, confirm it fails for the expected reason.
3. Implement `src/lib/images/snapgen.ts`.
4. Run `npx jest snapgenClient`, confirm all pass.
5. Commit: `feat: add snapgen.ai image generation client`

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest snapgenClient` passes, all 5 cases above covered
- [ ] No placeholder/TODO comments; no hardcoded API key
- [ ] `fetch` call count asserted in the "no poll needed" case (proves it doesn't over-poll)

---

### Phase 3: Server Actions — Generate & Persist

**Estimated time:** 20 minutes

**Files:**
- Modify: `src/app/admin/actions.ts`
- Test: `src/__tests__/adminImageActions.test.ts`

**New/changed exports:**
```ts
export async function generateCoverImage(prompt: string): Promise<string>
// requireUser(); calls generateImage(process.env.SNAPGEN_API_KEY!, { prompt, aspect_ratio: '16:9' }); returns the URL.

export async function generateBodySectionImage(prompt: string): Promise<string>
// same, aspect_ratio: '4:3'.

export async function updateCoverImage(articleId: string, url: string): Promise<void>
// requireUser(); db.update(articles).set({ coverImageUrl: url, updatedAt: new Date() }).where(eq(articles.id, articleId)); revalidatePath(`/admin/${articleId}`).

// createDraftArticle: input gains optional `coverImageUrl?: string`, passed into the
// existing `db.insert(articles).values({ tags, status: 'draft', coverImageUrl: input.coverImageUrl })`
// call (undefined is fine — Drizzle/Postgres treats it as "not set" for a nullable column).
```

**Steps:**
1. Write failing tests in `src/__tests__/adminImageActions.test.ts`. Mock `@/lib/images/snapgen` (`generateImage: jest.fn()`), `@/lib/db/client` (chainable `db.insert().values().returning()` and `db.update().set().where()` mocks, matching the `BlogSection.test.tsx` mocking style), `next/headers` (`cookies: jest.fn()`), and `@/lib/auth/session` (`verifySessionToken: jest.fn()`). Expected error: `generateCoverImage is not a function` (import from `@/app/admin/actions` before it's added).
   - No session cookie → `generateCoverImage('x')` rejects with `'Unauthorized'`; `generateImage` not called.
   - Valid session → `generateCoverImage('a cozy room')` calls the mocked `generateImage` with `(expect.any(String), { prompt: 'a cozy room', aspect_ratio: '16:9' })` and resolves to whatever the mock returned.
   - Valid session → `generateBodySectionImage('tip one')` calls `generateImage` with `aspect_ratio: '4:3'`.
   - `updateCoverImage('article-1', 'https://x/y.jpg')` → the mocked `db.update` chain's `.set` is called with an object containing `coverImageUrl: 'https://x/y.jpg'`.
   - `createDraftArticle({ tags: [], coverImageUrl: 'https://x/y.jpg', translations: [...] })` → the mocked `db.insert(articles).values` is called with an object containing `coverImageUrl: 'https://x/y.jpg'`.
2. Run `npx jest adminImageActions`, confirm it fails for the expected reason.
3. Implement the 3 new actions + `createDraftArticle` extension in `src/app/admin/actions.ts`.
4. Run `npx jest adminImageActions`, confirm all pass. Also run the pre-existing action-adjacent tests (`npx jest articleStatusTransition blogSlug`) to confirm no regression.
5. Commit: `feat: add cover/body image generation and persistence actions`

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest adminImageActions` passes, all 5 cases above covered
- [ ] Every new action calls `requireUser()` first (security-sensitive: server action, admin-only mutation — auth checked server-side, no secret exposed to client, `SNAPGEN_API_KEY` never leaves the server action)
- [ ] No placeholder/TODO comments in new code

---

### Phase 4: Shared UI Components

**Estimated time:** 20 minutes

**Files:**
- Create: `src/components/admin/CoverImageField.tsx`
- Create: `src/components/admin/GenerateImagesButton.tsx`
- Test: `src/__tests__/CoverImageField.test.tsx`
- Test: `src/__tests__/GenerateImagesButton.test.tsx`

**Design Deliverable:** markup/classes specified verbatim in the Design section above ("UI placement" + the two JSX templates for `new/page.tsx` cover block and the `Generate Images` block) — reused here as the two components' internal markup instead of being pasted inline into each page. No new tokens/classes beyond what's already in `tailwind.config.ts`.

**Contracts** (deliberately decoupled from the server actions — they take callback props, not action imports, so component tests can pass a fake async function instead of mocking `'use server'` modules):
```tsx
// CoverImageField.tsx
type Props = {
  initialPrompt: string
  initialUrl?: string | null
  onGenerate: (prompt: string) => Promise<string> // resolves to the image URL
  onGenerated?: (url: string) => void // fired after a successful generate/regenerate, for callers that persist immediately (EditForm)
}
export default function CoverImageField(props: Props): JSX.Element

// GenerateImagesButton.tsx
type Props = {
  body: string
  onBodyChange: (nextBody: string) => void
  onGenerate: (prompt: string) => Promise<string>
}
export default function GenerateImagesButton(props: Props): JSX.Element
// Internally: qualifyingSections(splitSections(body)), loop calling onGenerate(buildSectionImagePrompt(heading))
// sequentially, insertImageAfterSection after each success, onBodyChange(newBody) after each insert
// (not just at the end, so a mid-loop failure doesn't lose earlier successes). Failures push to a local
// error list and continue the loop.
```

**Steps:**
1. Write failing tests. Expected error: `Cannot find module '@/components/admin/CoverImageField'` / `'.../GenerateImagesButton'`.
   - `CoverImageField.test.tsx`: renders with `initialPrompt`, clicking "Generate Cover" calls `onGenerate` with the current prompt text, shows the resolved image (`<img>` with that `src`) after it resolves, button label flips to "Regenerate". A rejected `onGenerate` shows `role="alert"` text and re-enables the button.
   - `GenerateImagesButton.test.tsx`: given a 2-qualifying-section body, clicking the button calls `onGenerate` twice (once per section, with `buildSectionImagePrompt(heading)` as the arg) and `onBodyChange` is called with a body where both sections now contain `![...]()`. A body with 0 qualifying sections renders the button `disabled`. One `onGenerate` rejecting still lets the other section succeed and appends one error line.
2. Run `npx jest CoverImageField GenerateImagesButton`, confirm both fail for the expected reason.
3. Implement both components using the markup from the Design section (adapt class names 1:1, no invention).
4. Run `npx jest CoverImageField GenerateImagesButton`, confirm all pass.
5. Commit: `feat: add reusable cover/body image generation UI components`

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] Both test files pass, all cases above covered
- [ ] Every error line uses `role="alert"` (accessibility parity with `new/page.tsx`'s existing submit error)
- [ ] Rest-of-form independence: neither component reads or blocks on any prop outside its own `body`/`initialPrompt`/`initialUrl`
- [ ] No placeholder/TODO comments; no new Tailwind classes outside `tailwind.config.ts`'s existing tokens

---

### Phase 5: Wire into `new/page.tsx`

**Estimated time:** 15 minutes

**Files:**
- Modify: `src/app/admin/new/page.tsx`
- Test: `src/__tests__/NewArticlePage.test.tsx`

**Design Deliverable:** cover block placed beside the existing Tags field per the Design section's ASCII layout for `new/page.tsx`.

**Steps:**
1. Write a failing test in `src/__tests__/NewArticlePage.test.tsx`. Mock `@/app/admin/actions` (`createDraftArticle`, `generateCoverImage`, `generateBodySectionImage` as `jest.fn()`), mock `next/navigation`'s `useRouter`. Expected error: the "Cover Image" label/field doesn't exist yet (`screen.getByText('Cover Image')` throws).
   - Renders a "Cover Image" field alongside Tags.
   - Renders one "Generate Images" button per locale fieldset (2 total — `getAllByText('Generate Images')` has length 2).
   - Submitting the form after a cover was generated calls `createDraftArticle` with `coverImageUrl` set to the generated URL (simulate: click Generate Cover with mocked `generateCoverImage` resolving a URL, fill required fields, submit, assert the mock call's argument shape).
2. Run `npx jest NewArticlePage`, confirm it fails for the expected reason.
3. Implement: add `coverImageUrl`/`coverPrompt` state (prompt auto-derived via `buildCoverPrompt(id.title, id.quickAnswer)` from `src/lib/images/sections.ts`, recomputed with `useMemo` on `id.title`/`id.quickAnswer`), render `<CoverImageField onGenerate={generateCoverImage} onGenerated={setCoverImageUrl} .../>` next to Tags, render `<GenerateImagesButton onGenerate={generateBodySectionImage} .../>` inside `LocaleFieldset` under the Body textarea, pass `coverImageUrl` through to the `createDraftArticle` call in `handleSubmit`.
4. Run `npx jest NewArticlePage`, confirm all pass. Run `npx jest` (full suite) to confirm no regression elsewhere.
5. Commit: `feat: add cover/body image generation to the new-article admin form`

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest NewArticlePage` passes, all 3 cases above covered
- [ ] Full `npx jest` suite green (no regression in existing admin/blog tests)
- [ ] No placeholder/TODO comments in new code
- [ ] `SNAPGEN_API_KEY` is read only inside server actions (`actions.ts`), never referenced in this client component

---

### Phase 6: Wire into `EditForm.tsx`

**Estimated time:** 15 minutes

**Files:**
- Modify: `src/app/admin/[id]/EditForm.tsx`
- Test: `src/__tests__/EditFormImages.test.tsx`

**Design Deliverable:** full-width Cover Image card between the locale tabs and the existing 2-column grid, per the Design section's ASCII layout for `EditForm.tsx`.

**Steps:**
1. Write a failing test in `src/__tests__/EditFormImages.test.tsx`. Mock `@/app/admin/actions` (`updateArticleTranslation`, `publishArticle`, `rejectArticle`, `updateCoverImage`, `generateCoverImage`, `generateBodySectionImage` as `jest.fn()`), mock `next/navigation`'s `useRouter`. Expected error: `screen.getByText('Cover Image')` throws (field doesn't exist yet).
   - Renders the Cover Image card, pre-filled preview when the `article` prop already has a `coverImageUrl`.
   - Generating a cover (mocked `generateCoverImage` resolving a URL) calls `updateCoverImage(article.id, url)` — i.e. persists immediately, not deferred to "Simpan Perubahan".
   - Renders one "Generate Images" button for the active locale's body (switching the `activeLocale` tab still shows exactly one).
2. Run `npx jest EditFormImages`, confirm it fails for the expected reason.
3. Implement: extend the `Article`/`Translation` prop types to include `coverImageUrl: string | null`, add `coverImageUrl` state initialized from `article.coverImageUrl`, render the Cover Image card with `onGenerate={generateCoverImage}` and `onGenerated={async (url) => { setCoverImageUrl(url); await updateCoverImage(article.id, url) }}`, render `<GenerateImagesButton onGenerate={generateBodySectionImage} body={current.body} onBodyChange={(b) => updateCurrent({ body: b })} />` under the Body textarea for the active locale.
4. Run `npx jest EditFormImages`, confirm all pass. Run `npx jest` (full suite) to confirm no regression.
5. Commit: `feat: add cover/body image generation to the article edit admin form`

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest EditFormImages` passes, all 3 cases above covered
- [ ] Full `npx jest` suite green
- [ ] Cover generation persists immediately (asserted via the `updateCoverImage` call in the test), independent of the "Simpan Perubahan" button
- [ ] No placeholder/TODO comments in new code

---

## Execution Handoff

Ready to start Phase 1? I'll use `gaspol-execute` to implement with per-phase checkpoints.
