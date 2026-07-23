import { render, screen, fireEvent } from '@testing-library/react'
import Kontak from '@/components/Kontak'

test('Kontak WA CTA opens lead modal and renders address', () => {
  const handler = jest.fn()
  window.addEventListener('open-wa-modal', handler)
  render(<Kontak />)
  fireEvent.click(screen.getByRole('button', { name: /mulai proyek/i }))
  expect(handler).toHaveBeenCalledTimes(1)
  expect(screen.getByText(/Ciptaland/)).toBeInTheDocument()
  window.removeEventListener('open-wa-modal', handler)
})
