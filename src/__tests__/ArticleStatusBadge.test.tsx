import { render, screen } from '@testing-library/react'
import ArticleStatusBadge from '@/components/admin/ArticleStatusBadge'

describe('ArticleStatusBadge', () => {
  it('renders published status with accent styling', () => {
    render(<ArticleStatusBadge status="published" />)
    const badge = screen.getByText('Published')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('accent')
  })

  it('renders draft status', () => {
    render(<ArticleStatusBadge status="draft" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('renders in_review status', () => {
    render(<ArticleStatusBadge status="in_review" />)
    expect(screen.getByText('In Review')).toBeInTheDocument()
  })
})
