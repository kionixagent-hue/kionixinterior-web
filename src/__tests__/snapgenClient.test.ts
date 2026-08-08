import { generateImage } from '@/lib/images/snapgen'

function jsonResponse(ok: boolean, status: number, body: unknown) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) }
}

describe('generateImage', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('resolves immediately when the POST response is already completed', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(true, 200, { uuid: 'u1', status: 2, generate_result: 'https://x/1.jpg' })
    )

    const url = await generateImage('key', { prompt: 'a room', aspect_ratio: '16:9' })

    expect(url).toBe('https://x/1.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('polls history until status is completed', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(true, 200, { uuid: 'u2', status: 1 }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { uuid: 'u2', status: 1 }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { uuid: 'u2', status: 2, generate_result: 'https://x/2.jpg' }))

    const url = await generateImage(
      'key',
      { prompt: 'a room', aspect_ratio: '4:3' },
      { pollIntervalMs: 0, maxAttempts: 5 }
    )

    expect(url).toBe('https://x/2.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain('/history/u2')
  })

  it('rejects when generation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(true, 200, { uuid: 'u3', status: 1 }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { uuid: 'u3', status: 3, error_message: 'boom' }))

    await expect(
      generateImage('key', { prompt: 'x', aspect_ratio: '16:9' }, { pollIntervalMs: 0, maxAttempts: 5 })
    ).rejects.toThrow('boom')
  })

  it('rejects when the initial POST is not ok', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(false, 401, { detail: { error_code: 'API_KEY_NOT_FOUND', error_message: 'Api key is not found' } })
    )

    await expect(generateImage('bad-key', { prompt: 'x', aspect_ratio: '16:9' })).rejects.toThrow('401')
  })

  it('rejects on timeout when status never reaches completed', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(true, 200, { uuid: 'u4', status: 1 }))
      .mockResolvedValue(jsonResponse(true, 200, { uuid: 'u4', status: 1 }))

    await expect(
      generateImage('key', { prompt: 'x', aspect_ratio: '16:9' }, { pollIntervalMs: 0, maxAttempts: 2 })
    ).rejects.toThrow(/timed out/i)
  })
})
