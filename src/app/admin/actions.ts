'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { articles, articleTranslations } from '@/lib/db/schema'
import { generateSlug } from '@/lib/blog/slug'
import { nextStatus } from '@/lib/blog/status'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { generateImage } from '@/lib/images/snapgen'

async function requireUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const userId = token ? await verifySessionToken(token, process.env.SESSION_SECRET!) : null
  if (!userId) throw new Error('Unauthorized')
  return userId
}

export type TranslationInput = {
  locale: 'id' | 'en'
  title: string
  quickAnswer: string
  body: string
  metaDescription: string
  faq: { q: string; a: string }[]
}

export async function createDraftArticle(input: {
  tags: string[]
  coverImageUrl?: string
  translations: TranslationInput[]
}) {
  await requireUser()

  const locales = input.translations.map((t) => t.locale)
  if (locales.length !== 2 || !locales.includes('id') || !locales.includes('en')) {
    throw new Error('Both id and en translations are required')
  }
  for (const t of input.translations) {
    if (!t.title.trim() || !t.quickAnswer.trim() || !t.body.trim() || !t.metaDescription.trim()) {
      throw new Error(`Missing required field in ${t.locale} translation`)
    }
  }

  const [article] = await db
    .insert(articles)
    .values({ tags: input.tags, status: 'draft', coverImageUrl: input.coverImageUrl })
    .returning()

  for (const t of input.translations) {
    await db.insert(articleTranslations).values({
      articleId: article.id,
      locale: t.locale,
      slug: generateSlug(t.title),
      title: t.title,
      quickAnswer: t.quickAnswer,
      body: t.body,
      metaDescription: t.metaDescription,
      faq: t.faq,
    })
  }

  revalidatePath('/admin')
  return article.id
}

export async function updateArticleTranslation(
  articleId: string,
  locale: 'id' | 'en',
  fields: Omit<TranslationInput, 'locale'>
) {
  await requireUser()

  if (!fields.title.trim() || !fields.quickAnswer.trim() || !fields.body.trim() || !fields.metaDescription.trim()) {
    throw new Error('Missing required field')
  }

  await db
    .update(articleTranslations)
    .set({
      title: fields.title,
      quickAnswer: fields.quickAnswer,
      body: fields.body,
      metaDescription: fields.metaDescription,
      faq: fields.faq,
      slug: generateSlug(fields.title),
    })
    .where(and(eq(articleTranslations.articleId, articleId), eq(articleTranslations.locale, locale)))

  await db.update(articles).set({ updatedAt: new Date() }).where(eq(articles.id, articleId))

  revalidatePath(`/admin/${articleId}`)
  revalidatePath('/admin')
}

export async function publishArticle(articleId: string) {
  await requireUser()

  const [current] = await db.select().from(articles).where(eq(articles.id, articleId))
  if (!current) throw new Error('Article not found')

  await db
    .update(articles)
    .set({
      status: nextStatus('publish', current.status),
      updatedAt: new Date(),
      publishedAt: current.publishedAt ?? new Date(),
    })
    .where(eq(articles.id, articleId))

  revalidatePath(`/admin/${articleId}`)
  revalidatePath('/admin')
}

export async function rejectArticle(articleId: string) {
  await requireUser()

  const [current] = await db.select().from(articles).where(eq(articles.id, articleId))
  if (!current) throw new Error('Article not found')

  await db
    .update(articles)
    .set({ status: nextStatus('reject', current.status), updatedAt: new Date() })
    .where(eq(articles.id, articleId))

  revalidatePath(`/admin/${articleId}`)
  revalidatePath('/admin')
}

export async function generateCoverImage(prompt: string): Promise<string> {
  await requireUser()
  return generateImage(process.env.SNAPGEN_API_KEY!, { prompt, aspect_ratio: '16:9' })
}

export async function generateBodySectionImage(prompt: string): Promise<string> {
  await requireUser()
  return generateImage(process.env.SNAPGEN_API_KEY!, { prompt, aspect_ratio: '4:3' })
}

export async function updateCoverImage(articleId: string, url: string) {
  await requireUser()

  await db.update(articles).set({ coverImageUrl: url, updatedAt: new Date() }).where(eq(articles.id, articleId))

  revalidatePath(`/admin/${articleId}`)
}
