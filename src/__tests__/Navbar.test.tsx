import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import Navbar from '@/components/Navbar'

test('Navbar renders translated nav links and WA CTA opens lead modal', () => {
  const handler = jest.fn()
  window.addEventListener('open-wa-modal', handler)
  renderWithIntl(<Navbar />)
  expect(screen.getByText('LAYANAN')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /konsultasi gratis/i }))
  expect(handler).toHaveBeenCalledTimes(1)
  window.removeEventListener('open-wa-modal', handler)
})
