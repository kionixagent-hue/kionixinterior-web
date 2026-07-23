import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

test('Footer renders copyright and floating WA button', () => {
  render(<Footer />)
  expect(screen.getByText(/Kionix Interior/)).toBeInTheDocument()
  const wa = screen.getByRole('link', { name: /whatsapp/i })
  expect(wa).toHaveAttribute('href', expect.stringContaining('wa.me/6281372703589'))
})
