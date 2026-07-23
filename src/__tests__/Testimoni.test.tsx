import { render, screen } from '@testing-library/react'
import Testimoni from '@/components/Testimoni'

test('Testimoni renders 3 reviews', () => {
  render(<Testimoni />)
  expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
  expect(screen.getByText('Ibu Sari Dewi')).toBeInTheDocument()
  expect(screen.getByText('PT Maju Bersama')).toBeInTheDocument()
})
