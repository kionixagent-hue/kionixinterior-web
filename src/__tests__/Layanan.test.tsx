import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../messages/id.json'
import Layanan from '@/components/Layanan'

test('Layanan renders all 6 services with translated titles', async () => {
  const ui = await Layanan()
  render(
    <NextIntlClientProvider locale="id" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
  expect(screen.getByText('Kitchen Set')).toBeInTheDocument()
  expect(screen.getByText('Lemari Custom')).toBeInTheDocument()
  expect(screen.getByText('Backdrop TV')).toBeInTheDocument()
  expect(screen.getByText('Renovasi Rumah')).toBeInTheDocument()
  expect(screen.getByText('Interior Kantor')).toBeInTheDocument()
  expect(screen.getByText(/Hotel/)).toBeInTheDocument()
})
