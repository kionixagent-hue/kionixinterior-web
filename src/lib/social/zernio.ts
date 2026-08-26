const ZERNIO_POSTS_URL = 'https://zernio.com/api/v1/posts'

// Verified live against the Zernio API on 2026-08-26 (see
// docs/plans/2026-08-26-instagram-tiktok-auto-posting.md's "Kontrak API Zernio").
const TIKTOK_TITLE_MAX_LENGTH = 90

export function buildZernioPayload(input: {
  caption: string
  tiktokTitle: string
  imageUrls: string[]
  profileId: string
  igAccountId: string
  tiktokAccountId: string
  tiktokPrivacyLevel: string
}) {
  return {
    content: input.caption,
    publishNow: true,
    timezone: 'Asia/Jakarta',
    profileId: input.profileId,
    platforms: [
      { platform: 'instagram', accountId: input.igAccountId },
      {
        platform: 'tiktok',
        accountId: input.tiktokAccountId,
        // TikTok photo posts use the platform's `content` (here, customContent) as the
        // slideshow title, hard-capped at ~90 chars — Zernio rejects the request outright
        // rather than truncating, even with tiktokSettings.description set. The article
        // title is short by construction; sliced defensively in case a future one isn't.
        customContent: input.tiktokTitle.slice(0, TIKTOK_TITLE_MAX_LENGTH),
      },
    ],
    mediaItems: input.imageUrls.map((url) => ({ type: 'image', url })),
    tiktokSettings: {
      privacy_level: input.tiktokPrivacyLevel,
      allow_comment: true,
      allow_duet: true,
      allow_stitch: true,
      commercial_content_type: 'none',
      content_preview_confirmed: true,
      express_consent_given: true,
      media_type: 'photo',
      // TikTok photo posts use `content` as the slideshow title, capped at ~90 chars —
      // Zernio rejects (doesn't silently truncate) captions longer than that unless a
      // `description` is also supplied, which carries the full text instead.
      description: input.caption,
      // Direct posting hit TikTok's own "at capacity" gate for this (newly-connected)
      // account — confirmed live 2026-08-26, Zernio's own error message names this as
      // the fix: deliver via TikTok's Creator Inbox instead of direct publish. Trades
      // full automation for reliability — a human still taps "Post" once inside the
      // TikTok app per article. Revisit direct posting if the account gets audited/
      // capacity opens up.
      draft: true,
    },
  }
}

export async function postToZernio(
  apiKey: string,
  payload: unknown,
  fetchImpl: typeof fetch = fetch
): Promise<unknown> {
  const res = await fetchImpl(ZERNIO_POSTS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Zernio post failed: ${res.status} ${await res.text()}`)
  return res.json()
}
