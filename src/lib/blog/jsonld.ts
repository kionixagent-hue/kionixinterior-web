import { COMPANY_NAME } from '@/lib/constants'

const SITE_URL = 'https://kionixinterior.com'

export function buildBlogPostingJsonLd(article: {
  title: string
  slug: string
  locale: string
  metaDescription: string
  createdAt: Date
  updatedAt: Date
  coverImageUrl: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.metaDescription,
    image: article.coverImageUrl ?? `${SITE_URL}/logo.png`,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { '@type': 'Organization', name: 'Tim Kionix Interior' },
    publisher: {
      '@type': 'Organization',
      name: COMPANY_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${article.locale === 'id' ? '' : '/' + article.locale}/blog/${article.slug}`,
    },
  }
}

// Escapes `<` so a value containing "</script>" can't break out of the JSON-LD <script> tag.
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function buildLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: COMPANY_NAME,
    image: `${SITE_URL}/logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ruko Ciptaland Blok Lavender No.26',
      addressLocality: 'Batam',
      addressCountry: 'ID',
    },
    telephone: '+6281372703589',
  }
}
