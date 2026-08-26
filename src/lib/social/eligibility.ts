export function needsSocialPost(article: { status: string; socialPostedAt: Date | null }): boolean {
  return article.status === 'published' && article.socialPostedAt === null
}
