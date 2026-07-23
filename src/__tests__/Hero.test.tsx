import { render, screen, fireEvent } from '@testing-library/react'
import Hero from '@/components/Hero'

test('Hero WA CTA opens the lead modal', () => {
  const handler = jest.fn()
  window.addEventListener('open-wa-modal', handler)
  render(<Hero />)
  fireEvent.click(screen.getByRole('button', { name: /konsultasi gratis via whatsapp/i }))
  expect(handler).toHaveBeenCalledTimes(1)
  window.removeEventListener('open-wa-modal', handler)
})
