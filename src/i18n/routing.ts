import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['id', 'en', 'zh'],
  defaultLocale: 'id',
  localePrefix: 'as-needed',
})
