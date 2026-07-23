import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../messages/id.json'
import Testimoni from '@/components/Testimoni'

test('Testimoni renders 3 translated reviews', async () => {
  const ui = await Testimoni()
  render(
    <NextIntlClientProvider locale="id" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
  expect(screen.getByText('Lamoist')).toBeInTheDocument()
  expect(screen.getByText('Ibu Sari Dewi')).toBeInTheDocument()
  expect(screen.getByText('PT Maju Bersama')).toBeInTheDocument()
})
