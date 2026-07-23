import { render, screen } from '@testing-library/react'
import Portfolio from '@/components/Portfolio'

test('Portfolio renders 9 project cards', () => {
  render(<Portfolio />)
  expect(screen.getByText('Kitchen Set')).toBeInTheDocument()
  expect(screen.getByText('Ruang Tamu')).toBeInTheDocument()
  expect(screen.getByText('Retail Booth')).toBeInTheDocument()
})
