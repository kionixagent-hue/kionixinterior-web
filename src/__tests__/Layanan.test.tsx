import { render, screen } from '@testing-library/react'
import Layanan from '@/components/Layanan'

test('Layanan renders all 6 services', () => {
  render(<Layanan />)
  expect(screen.getByText('Kitchen Set')).toBeInTheDocument()
  expect(screen.getByText('Lemari Custom')).toBeInTheDocument()
  expect(screen.getByText('Backdrop TV')).toBeInTheDocument()
  expect(screen.getByText('Renovasi Rumah')).toBeInTheDocument()
  expect(screen.getByText('Interior Kantor')).toBeInTheDocument()
  expect(screen.getByText(/Hotel/)).toBeInTheDocument()
})
