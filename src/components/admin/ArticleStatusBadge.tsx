const STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'border border-text-muted text-text-muted' },
  in_review: { label: 'In Review', className: 'border border-accent text-accent' },
  published: { label: 'Published', className: 'bg-accent text-text-on-dark' },
} as const

export type ArticleStatus = keyof typeof STATUS_CONFIG

export default function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`inline-block rounded px-2 py-0.5 font-sans text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
