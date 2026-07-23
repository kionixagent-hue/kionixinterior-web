import { render, screen } from '@testing-library/react'
import TentangKami from '@/components/TentangKami'

test('TentangKami renders stats', () => {
  render(<TentangKami />)
  expect(screen.getByText('50+')).toBeInTheDocument()
  expect(screen.getByText('Proyek Selesai')).toBeInTheDocument()
})
