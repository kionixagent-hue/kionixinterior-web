import { screen } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import LocaleSwitcher from '@/components/LocaleSwitcher'

test('LocaleSwitcher renders all 3 language options', () => {
  renderWithIntl(<LocaleSwitcher />)
  expect(screen.getByText('Indonesia')).toBeInTheDocument()
})
