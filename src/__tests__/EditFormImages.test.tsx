import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditForm from '@/app/admin/[id]/EditForm'

const updateArticleTranslationMock = jest.fn()
const publishArticleMock = jest.fn()
const rejectArticleMock = jest.fn()
const updateCoverImageMock = jest.fn()
const generateCoverImageMock = jest.fn()
const generateBodySectionImageMock = jest.fn()
const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

// react-markdown's ESM dependency tree isn't transformed by this project's jest
// config; this suite tests the cover/body-image wiring, not markdown rendering, so
// a trivial passthrough mock avoids fighting that transform for an unrelated concern.
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => children,
}))

jest.mock('@/app/admin/actions', () => ({
  updateArticleTranslation: (...args: unknown[]) => updateArticleTranslationMock(...args),
  publishArticle: (...args: unknown[]) => publishArticleMock(...args),
  rejectArticle: (...args: unknown[]) => rejectArticleMock(...args),
  updateCoverImage: (...args: unknown[]) => updateCoverImageMock(...args),
  generateCoverImage: (...args: unknown[]) => generateCoverImageMock(...args),
  generateBodySectionImage: (...args: unknown[]) => generateBodySectionImageMock(...args),
}))

const baseArticle = {
  id: 'article-1',
  status: 'draft' as const,
  coverImageUrl: null as string | null,
  translations: [
    { locale: 'id' as const, title: 'Judul', quickAnswer: 'Q', body: 'B', metaDescription: 'M', faq: [] },
    { locale: 'en' as const, title: 'Title', quickAnswer: 'Q', body: 'B', metaDescription: 'M', faq: [] },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('EditForm — images', () => {
  it('renders the Cover Image card, pre-filled when the article already has one', () => {
    render(<EditForm article={{ ...baseArticle, coverImageUrl: 'https://x/cover.jpg' }} />)
    expect(screen.getByText('Cover Image')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /cover/i })).toHaveAttribute('src', 'https://x/cover.jpg')
  })

  it('persists the cover immediately via updateCoverImage after generating', async () => {
    generateCoverImageMock.mockResolvedValue('https://x/new-cover.jpg')
    render(<EditForm article={baseArticle} />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate Cover' }))

    await waitFor(() => expect(updateCoverImageMock).toHaveBeenCalledWith('article-1', 'https://x/new-cover.jpg'))
  })

  it('renders exactly one Generate Images button for the active locale', () => {
    render(<EditForm article={baseArticle} />)
    expect(screen.getAllByRole('button', { name: 'Generate Images' })).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getAllByRole('button', { name: 'Generate Images' })).toHaveLength(1)
  })
})
