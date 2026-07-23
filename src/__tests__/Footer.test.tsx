import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

test('Footer renders copyright and social links', () => {
  render(<Footer />)
  expect(screen.getByText(/Kionix Interior/)).toBeInTheDocument()
  const instagram = screen.getByRole('link', { name: /instagram/i })
  expect(instagram).toHaveAttribute('href', expect.stringContaining('instagram.com/kionixinterior'))
})
