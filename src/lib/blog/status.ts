import type { ArticleStatus } from '@/components/admin/ArticleStatusBadge'

export function nextStatus(action: 'publish' | 'reject', current: ArticleStatus): ArticleStatus {
  if (action === 'publish') return 'published'
  if (action === 'reject') return current === 'in_review' ? 'draft' : current
  return current
}
