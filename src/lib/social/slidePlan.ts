import { splitSections } from '@/lib/images/sections'

const IMAGE_URL_RE = /!\[[^\]]*\]\(([^)]*)\)/
const MAX_POINT_SLIDES = 5

export type Slide = { kind: 'cover' | 'point'; imageUrl: string; text: string }

export function buildSlidePlan(article: { title: string; coverImageUrl: string; body: string }): Slide[] {
  const pointSlides: Slide[] = splitSections(article.body)
    .filter((s) => s.hasImage)
    .slice(0, MAX_POINT_SLIDES)
    .map((s) => ({ kind: 'point' as const, imageUrl: s.content.match(IMAGE_URL_RE)?.[1] ?? '', text: s.heading }))
    .filter((s) => s.imageUrl !== '')

  return [{ kind: 'cover', imageUrl: article.coverImageUrl, text: article.title }, ...pointSlides]
}
