import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../messages/id.json'
import Footer from '@/components/Footer'

test('Footer renders copyright and social links', async () => {
  const ui = await Footer()
  render(
    <NextIntlClientProvider locale="id" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
  expect(screen.getByText(/Kionix Interior/)).toBeInTheDocument()
  const instagram = screen.getByRole('link', { name: /instagram/i })
  expect(instagram).toHaveAttribute('href', expect.stringContaining('instagram.com/kionixinterior'))
})
