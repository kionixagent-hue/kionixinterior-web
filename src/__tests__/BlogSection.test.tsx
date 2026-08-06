import { render, screen } from '@testing-library/react'
import { getLocale, getTranslations } from 'next-intl/server'
import BlogSection from '@/components/BlogSection'

const limitMock = jest.fn()

jest.mock('@/lib/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: () => ({
              limit: (...args: unknown[]) => limitMock(...args),
            }),
          }),
        }),
      }),
    }),
  },
}))

jest.mock('next-intl/server', () => ({
  getLocale: jest.fn(),
  getTranslations: jest.fn(),
}))

const mockT = (key: string) => ({ eyebrow: 'ARTIKEL & INSPIRASI', title: 'Dari Blog Kami', cta: 'Lihat Semua Artikel →' })[key as 'eyebrow' | 'title' | 'cta']

beforeEach(() => {
  limitMock.mockReset()
  ;(getTranslations as jest.Mock).mockResolvedValue(mockT)
})

describe('BlogSection', () => {
  it('renders up to 3 published articles when present', async () => {
    ;(getLocale as jest.Mock).mockResolvedValue('id')
    limitMock.mockResolvedValue([
      { slug: 'a', title: 'Tips Kitchen Set', quickAnswer: 'Ringkasan A' },
      { slug: 'b', title: 'Renovasi Kamar', quickAnswer: 'Ringkasan B' },
    ])

    const ui = await BlogSection()
    render(ui!)

    expect(screen.getByText('Tips Kitchen Set')).toBeInTheDocument()
    expect(screen.getByText('Renovasi Kamar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Lihat Semua Artikel/ })).toHaveAttribute('href', '/blog')
  })

  it('renders nothing when there are no published articles', async () => {
    ;(getLocale as jest.Mock).mockResolvedValue('id')
    limitMock.mockResolvedValue([])

    const ui = await BlogSection()
    expect(ui).toBeNull()
  })

  it('renders nothing for the zh locale (no blog content there)', async () => {
    ;(getLocale as jest.Mock).mockResolvedValue('zh')

    const ui = await BlogSection()
    expect(ui).toBeNull()
    expect(limitMock).not.toHaveBeenCalled()
  })
})
