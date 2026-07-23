import { routing } from '@/i18n/routing'

test('routing declares id, en, zh with id as default and no forced prefix', () => {
  expect(routing.locales).toEqual(['id', 'en', 'zh'])
  expect(routing.defaultLocale).toBe('id')
  expect(routing.localePrefix).toBe('as-needed')
})
