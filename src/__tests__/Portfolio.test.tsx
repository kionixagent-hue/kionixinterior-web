import { screen } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import Portfolio from '@/components/Portfolio'

test('Portfolio renders 9 project cards with translated titles', () => {
  renderWithIntl(<Portfolio />)
  expect(screen.getByText('Kitchen Set')).toBeInTheDocument()
  expect(screen.getByText('Ruang Tamu')).toBeInTheDocument()
  expect(screen.getByText('Retail Booth')).toBeInTheDocument()
})
