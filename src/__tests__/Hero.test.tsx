import { render, screen } from '@testing-library/react'
import Hero from '@/components/Hero'

test('Hero renders WA CTA with correct href', () => {
  render(<Hero />)
  const cta = screen.getByRole('link', { name: /konsultasi gratis via whatsapp/i })
  expect(cta).toHaveAttribute('href', expect.stringContaining('wa.me/6281372703589'))
})
