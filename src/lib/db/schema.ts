import { relations } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, jsonb, numeric, pgEnum, unique } from 'drizzle-orm/pg-core'

export const articleStatusEnum = pgEnum('article_status', ['draft', 'in_review', 'published'])
export const articleLocaleEnum = pgEnum('article_locale', ['id', 'en'])
export const topicStatusEnum = pgEnum('topic_status', ['new', 'used', 'dismissed'])

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: articleStatusEnum('status').notNull().default('draft'),
  tags: text('tags').array().notNull().default([]),
  coverImageUrl: text('cover_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const articleTranslations = pgTable('article_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  locale: articleLocaleEnum('locale').notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  quickAnswer: text('quick_answer').notNull(),
  body: text('body').notNull(),
  metaDescription: text('meta_description').notNull(),
  faq: jsonb('faq').$type<{ q: string; a: string }[]>().notNull().default([]),
}, (table) => ({
  localeSlugUnique: unique().on(table.locale, table.slug),
  articleLocaleUnique: unique().on(table.articleId, table.locale),
})).enableRLS()

export const topics = pgTable('topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  keyword: text('keyword').notNull(),
  source: text('source').notNull().default('google_trends'),
  score: numeric('score'),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
  status: topicStatusEnum('status').notNull().default('new'),
}).enableRLS()

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const articlesRelations = relations(articles, ({ many }) => ({
  translations: many(articleTranslations),
}))

export const articleTranslationsRelations = relations(articleTranslations, ({ one }) => ({
  article: one(articles, { fields: [articleTranslations.articleId], references: [articles.id] }),
}))