const writeFileMock = jest.fn()
const mkdirMock = jest.fn()

jest.mock('node:fs/promises', () => ({
  writeFile: (...args: unknown[]) => writeFileMock(...args),
  mkdir: (...args: unknown[]) => mkdirMock(...args),
}))

import { persistImageLocally } from '@/lib/images/storage'

function fakeFetch(ok: boolean, status: number, contentType: string | null) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    headers: { get: () => contentType },
    arrayBuffer: async () => new ArrayBuffer(4),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('persistImageLocally', () => {
  it('downloads and writes the file, returning a local /uploads path', async () => {
    const fetchImpl = fakeFetch(true, 200, 'image/png')
    const url = await persistImageLocally('https://cdn.example.com/x/y.png?sig=abc', fetchImpl)

    expect(fetchImpl).toHaveBeenCalledWith('https://cdn.example.com/x/y.png?sig=abc')
    expect(mkdirMock).toHaveBeenCalledWith(expect.stringContaining('uploads'), { recursive: true })
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    expect(url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/)
  })

  it('falls back to the URL path extension when content-type is missing', async () => {
    const fetchImpl = fakeFetch(true, 200, null)
    const url = await persistImageLocally('https://cdn.example.com/x/y.jpg', fetchImpl)
    expect(url).toMatch(/\.jpg$/)
  })

  it('throws when the download fails', async () => {
    const fetchImpl = fakeFetch(false, 404, null)
    await expect(persistImageLocally('https://cdn.example.com/gone.png', fetchImpl)).rejects.toThrow('404')
    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
