import { render, screen, fireEvent } from '@testing-library/react'
import Navbar from '@/components/Navbar'

test('Navbar WA CTA opens lead modal', () => {
  const handler = jest.fn()
  window.addEventListener('open-wa-modal', handler)
  render(<Navbar />)
  fireEvent.click(screen.getByRole('button', { name: /konsultasi gratis/i }))
  expect(handler).toHaveBeenCalledTimes(1)
  window.removeEventListener('open-wa-modal', handler)
})
