import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../messages/id.json'
import BlogIndex from '@/components/BlogIndex'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/blog',
}))

const mockArticles = [
  {
    id: '1',
    slug: 'tips-kitchen-set-batam',
    title: 'Tips Kitchen Set Batam',
    quickAnswer: 'Ringkasan tips kitchen set.',
    tags: ['kitchen-set'],
    status: 'published' as const,
    publishedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: '2',
    slug: 'draft-yang-belum-tayang',
    title: 'Draft Yang Belum Tayang',
    quickAnswer: 'Draft belum tayang.',
    tags: ['draft-tag'],
    status: 'draft' as const,
    publishedAt: null,
  },
]

function renderBlogIndex(articles = mockArticles) {
  return render(
    <NextIntlClientProvider locale="id" messages={messages}>
      <BlogIndex articles={articles} />
    </NextIntlClientProvider>
  )
}

describe('BlogIndex', () => {
  it('renders published articles', () => {
    renderBlogIndex()
    expect(screen.getByText('Tips Kitchen Set Batam')).toBeInTheDocument()
  })

  it('never renders draft articles, even if passed in', () => {
    renderBlogIndex()
    expect(screen.queryByText('Draft Yang Belum Tayang')).not.toBeInTheDocument()
  })
})
