import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const base = 'https://kionixinterior.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? base : `${base}/${locale}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, l === routing.defaultLocale ? base : `${base}/${l}`])
      ),
    },
  }))
}
