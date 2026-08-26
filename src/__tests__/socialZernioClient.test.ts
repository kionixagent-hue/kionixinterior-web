import { buildZernioPayload, postToZernio } from '@/lib/social/zernio'

describe('buildZernioPayload', () => {
  it('produces the exact request shape validated against the live Zernio API', () => {
    const payload = buildZernioPayload({
      caption: 'Caption text',
      imageUrls: ['https://kionixinterior.com/uploads/a.jpg', 'https://kionixinterior.com/uploads/b.jpg'],
      profileId: 'PROFILE_ID',
      igAccountId: 'IG_ID',
      tiktokAccountId: 'TT_ID',
      tiktokPrivacyLevel: 'PUBLIC_TO_EVERYONE',
    })

    expect(payload).toEqual({
      content: 'Caption text',
      publishNow: true,
      timezone: 'Asia/Jakarta',
      profileId: 'PROFILE_ID',
      platforms: [
        { platform: 'instagram', accountId: 'IG_ID' },
        { platform: 'tiktok', accountId: 'TT_ID' },
      ],
      mediaItems: [
        { type: 'image', url: 'https://kionixinterior.com/uploads/a.jpg' },
        { type: 'image', url: 'https://kionixinterior.com/uploads/b.jpg' },
      ],
      tiktokSettings: {
        privacy_level: 'PUBLIC_TO_EVERYONE',
        allow_comment: true,
        allow_duet: true,
        allow_stitch: true,
        commercial_content_type: 'none',
        content_preview_confirmed: true,
        express_consent_given: true,
        media_type: 'photo',
      },
    })
  })
})

describe('postToZernio', () => {
  function jsonResponse(ok: boolean, status: number, body: unknown) {
    return { ok, status, json: async () => body, text: async () => JSON.stringify(body) }
  }

  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
  })

  it('resolves with the response body on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(true, 200, { post: { _id: 'p1' } }))

    const result = await postToZernio('key', { some: 'payload' }, fetchMock as unknown as typeof fetch)

    expect(result).toEqual({ post: { _id: 'p1' } })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://zernio.com/api/v1/posts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer key', 'Content-Type': 'application/json' }),
      })
    )
  })

  it('rejects with status + body on failure, without leaking the api key', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(false, 401, { error: 'Unauthorized' }))

    let message = ''
    try {
      await postToZernio('secret-key', {}, fetchMock as unknown as typeof fetch)
    } catch (e) {
      message = (e as Error).message
    }

    expect(message).toMatch(/401/)
    expect(message).not.toContain('secret-key')
  })
})
