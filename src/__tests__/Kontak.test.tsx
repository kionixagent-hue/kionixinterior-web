import { render, screen } from '@testing-library/react'
import Kontak from '@/components/Kontak'

test('Kontak renders WA CTA and address', () => {
  render(<Kontak />)
  const cta = screen.getByRole('link', { name: /mulai proyek/i })
  expect(cta).toHaveAttribute('href', expect.stringContaining('wa.me/6281372703589'))
  expect(screen.getByText(/Ciptaland/)).toBeInTheDocument()
})
