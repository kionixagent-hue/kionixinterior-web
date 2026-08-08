import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewArticlePage from '@/app/admin/new/page'

const createDraftArticleMock = jest.fn()
const generateCoverImageMock = jest.fn()
const generateBodySectionImageMock = jest.fn()
const pushMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

jest.mock('@/app/admin/actions', () => ({
  createDraftArticle: (...args: unknown[]) => createDraftArticleMock(...args),
  generateCoverImage: (...args: unknown[]) => generateCoverImageMock(...args),
  generateBodySectionImage: (...args: unknown[]) => generateBodySectionImageMock(...args),
}))

function fillLocale(index: number, body = 'Long enough body content for this article, well past forty chars.') {
  fireEvent.change(screen.getAllByLabelText('Judul')[index], { target: { value: 'A Title' } })
  fireEvent.change(screen.getAllByLabelText(/Quick Answer/)[index], { target: { value: 'A quick answer.' } })
  fireEvent.change(screen.getAllByLabelText('Body (markdown)')[index], { target: { value: body } })
  fireEvent.change(screen.getAllByLabelText('Meta Description')[index], { target: { value: 'A meta description.' } })
}

beforeEach(() => {
  jest.clearAllMocks()
  createDraftArticleMock.mockResolvedValue('new-article-id')
})

describe('NewArticlePage', () => {
  it('renders a Cover Image field alongside Tags', () => {
    render(<NewArticlePage />)
    expect(screen.getByText('Cover Image')).toBeInTheDocument()
  })

  it('renders one Generate Images button per locale', () => {
    render(<NewArticlePage />)
    expect(screen.getAllByRole('button', { name: 'Generate Images' })).toHaveLength(2)
  })

  it('disables Submit while a cover generation is in flight', async () => {
    let resolveGenerate: (url: string) => void = () => {}
    generateCoverImageMock.mockReturnValue(new Promise<string>((r) => (resolveGenerate = r)))
    render(<NewArticlePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate Cover' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Menunggu gambar/ })).toBeDisabled())

    resolveGenerate('https://x/cover.jpg')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan Draft' })).not.toBeDisabled())
  })

  it('includes the generated cover url when submitting the draft', async () => {
    generateCoverImageMock.mockResolvedValue('https://x/cover.jpg')
    render(<NewArticlePage />)

    fillLocale(0)
    fillLocale(1)

    fireEvent.click(screen.getByRole('button', { name: 'Generate Cover' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Draft' }))

    await waitFor(() => expect(createDraftArticleMock).toHaveBeenCalledTimes(1))
    expect(createDraftArticleMock).toHaveBeenCalledWith(
      expect.objectContaining({ coverImageUrl: 'https://x/cover.jpg' })
    )
  })
})
