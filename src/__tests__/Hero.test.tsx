import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import Hero from '@/components/Hero'

test('Hero WA CTA opens the lead modal with translated label', () => {
  const handler = jest.fn()
  window.addEventListener('open-wa-modal', handler)
  renderWithIntl(<Hero />)
  expect(screen.getByText('Wujudkan Ruang Impian Anda')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /konsultasi gratis via whatsapp/i }))
  expect(handler).toHaveBeenCalledTimes(1)
  window.removeEventListener('open-wa-modal', handler)
})
