import { render, screen } from '@testing-library/react'
import QuickAnswerBox from '@/components/QuickAnswerBox'

describe('QuickAnswerBox', () => {
  it('renders the quick-answer text with the teal border-left styling', () => {
    render(<QuickAnswerBox text="Kitchen set custom di Batam mulai dari Rp5 juta." />)
    const box = screen.getByText('Kitchen set custom di Batam mulai dari Rp5 juta.')
    expect(box).toBeInTheDocument()
    expect(box.className).toContain('border-l-')
    expect(box.className).toContain('accent')
  })
})
