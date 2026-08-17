const insertValuesMock = jest.fn()
const updateSetMock = jest.fn()
const updateWhereMock = jest.fn()
const generateImageMock = jest.fn()
const persistImageLocallyMock = jest.fn()
const cookiesGetMock = jest.fn()
const verifySessionTokenMock = jest.fn()

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

jest.mock('next/headers', () => ({
  cookies: async () => ({ get: cookiesGetMock }),
}))

jest.mock('@/lib/auth/session', () => ({
  SESSION_COOKIE_NAME: 'kionix_admin_session',
  verifySessionToken: (...args: unknown[]) => verifySessionTokenMock(...args),
}))

jest.mock('@/lib/images/snapgen', () => ({
  generateImage: (...args: unknown[]) => generateImageMock(...args),
}))

jest.mock('@/lib/images/storage', () => ({
  persistImageLocally: (...args: unknown[]) => persistImageLocallyMock(...args),
}))

jest.mock('@/lib/db/client', () => ({
  db: {
    insert: (table: unknown) => ({
      values: (vals: unknown) => {
        insertValuesMock(table, vals)
        const resolved = Promise.resolve(undefined)
        return {
          returning: async () => [{ id: 'article-1' }],
          then: resolved.then.bind(resolved),
          catch: resolved.catch.bind(resolved),
        }
      },
    }),
    update: () => ({
      set: (vals: unknown) => {
        updateSetMock(vals)
        return {
          where: (cond: unknown) => {
            updateWhereMock(cond)
            return Promise.resolve()
          },
        }
      },
    }),
  },
}))

import { generateCoverImage, generateBodySectionImage, updateCoverImage, createDraftArticle } from '@/app/admin/actions'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.SNAPGEN_API_KEY = 'test-key'
})

describe('auth guard', () => {
  it('rejects when there is no session cookie', async () => {
    cookiesGetMock.mockReturnValue(undefined)
    await expect(generateCoverImage('a room')).rejects.toThrow('Unauthorized')
    expect(generateImageMock).not.toHaveBeenCalled()
  })
})

describe('generateCoverImage', () => {
  it('calls generateImage with 16:9 aspect ratio, then persists the result locally', async () => {
    cookiesGetMock.mockReturnValue({ value: 'token' })
    verifySessionTokenMock.mockResolvedValue('user-1')
    generateImageMock.mockResolvedValue('https://snapgen.example/temp-cover.jpg')
    persistImageLocallyMock.mockResolvedValue('/uploads/cover.jpg')

    const url = await generateCoverImage('a cozy room')

    expect(url).toBe('/uploads/cover.jpg')
    expect(generateImageMock).toHaveBeenCalledWith('test-key', { prompt: 'a cozy room', aspect_ratio: '16:9' })
    expect(persistImageLocallyMock).toHaveBeenCalledWith('https://snapgen.example/temp-cover.jpg')
  })
})

describe('generateBodySectionImage', () => {
  it('calls generateImage with 4:3 aspect ratio, then persists the result locally', async () => {
    cookiesGetMock.mockReturnValue({ value: 'token' })
    verifySessionTokenMock.mockResolvedValue('user-1')
    generateImageMock.mockResolvedValue('https://snapgen.example/temp-section.jpg')
    persistImageLocallyMock.mockResolvedValue('/uploads/section.jpg')

    const url = await generateBodySectionImage('tip one')

    expect(url).toBe('/uploads/section.jpg')
    expect(generateImageMock).toHaveBeenCalledWith('test-key', { prompt: 'tip one', aspect_ratio: '4:3' })
    expect(persistImageLocallyMock).toHaveBeenCalledWith('https://snapgen.example/temp-section.jpg')
  })
})

describe('updateCoverImage', () => {
  it('persists the cover image url for an existing article', async () => {
    cookiesGetMock.mockReturnValue({ value: 'token' })
    verifySessionTokenMock.mockResolvedValue('user-1')

    await updateCoverImage('article-1', 'https://x/cover.jpg')

    expect(updateSetMock).toHaveBeenCalledWith(expect.objectContaining({ coverImageUrl: 'https://x/cover.jpg' }))
    expect(updateWhereMock).toHaveBeenCalled()
  })
})

describe('createDraftArticle', () => {
  it('includes coverImageUrl in the articles insert when provided', async () => {
    cookiesGetMock.mockReturnValue({ value: 'token' })
    verifySessionTokenMock.mockResolvedValue('user-1')

    await createDraftArticle({
      tags: [],
      coverImageUrl: 'https://x/cover.jpg',
      translations: [
        { locale: 'id', title: 'T', quickAnswer: 'Q', body: 'B', metaDescription: 'M', faq: [] },
        { locale: 'en', title: 'T', quickAnswer: 'Q', body: 'B', metaDescription: 'M', faq: [] },
      ],
    })

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ coverImageUrl: 'https://x/cover.jpg' })
    )
  })
})
