import { screen } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import TentangKami from '@/components/TentangKami'

test('TentangKami renders translated heading and stats', () => {
  renderWithIntl(<TentangKami />)
  expect(screen.getByText('50+')).toBeInTheDocument()
  expect(screen.getByText('Proyek Selesai')).toBeInTheDocument()
})
