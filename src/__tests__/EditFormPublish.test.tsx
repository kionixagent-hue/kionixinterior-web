import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditForm from '@/app/admin/[id]/EditForm'

const publishArticleMock = jest.fn()
const rejectArticleMock = jest.fn()
const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => children,
}))

jest.mock('@/app/admin/actions', () => ({
  updateArticleTranslation: jest.fn(),
  publishArticle: (...args: unknown[]) => publishArticleMock(...args),
  rejectArticle: (...args: unknown[]) => rejectArticleMock(...args),
  updateCoverImage: jest.fn(),
  generateCoverImage: jest.fn(),
  generateBodySectionImage: jest.fn(),
}))

const baseArticle = {
  id: 'article-1',
  status: 'in_review' as const,
  coverImageUrl: null as string | null,
  translations: [
    { locale: 'id' as const, title: 'Judul', quickAnswer: 'Q', body: 'B', metaDescription: 'M', faq: [] },
    { locale: 'en' as const, title: 'Title', quickAnswer: 'Q', body: 'B', metaDescription: 'M', faq: [] },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('EditForm — publish/reject feedback', () => {
  it('disables the buttons and shows pending text while publishing, re-enables after', async () => {
    let resolvePublish: () => void = () => {}
    publishArticleMock.mockReturnValue(new Promise<void>((resolve) => (resolvePublish = resolve)))

    render(<EditForm article={baseArticle} />)
    const publishButton = screen.getByText('Approve & Publish')
    fireEvent.click(publishButton)

    expect(await screen.findByText('Menyimpan...')).toBeInTheDocument()
    expect(screen.getByText('Reject')).toBeDisabled()

    resolvePublish()
    await waitFor(() => expect(screen.getByText('Approve & Publish')).toBeInTheDocument())
    expect(refreshMock).toHaveBeenCalled()
  })

  it('shows an error message if publishing fails', async () => {
    publishArticleMock.mockRejectedValue(new Error('boom'))
    render(<EditForm article={baseArticle} />)

    fireEvent.click(screen.getByText('Approve & Publish'))

    expect(await screen.findByText('Gagal publikasi.')).toBeInTheDocument()
  })
})
