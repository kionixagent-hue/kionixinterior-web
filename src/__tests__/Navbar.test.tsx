import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

test('Navbar renders WA CTA link', () => {
  render(<Navbar />)
  const link = screen.getByRole('link', { name: /konsultasi gratis/i })
  expect(link).toHaveAttribute('href', expect.stringContaining('wa.me/6281372703589'))
})
