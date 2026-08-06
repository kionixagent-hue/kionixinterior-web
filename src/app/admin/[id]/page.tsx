import { notFound } from 'next/navigation'
import { db } from '@/lib/db/client'
import EditForm from './EditForm'

export const dynamic = 'force-dynamic'

export default async function AdminArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const article = await db.query.articles.findFirst({
    where: (articles, { eq }) => eq(articles.id, id),
    with: { translations: true },
  })

  if (!article) notFound()

  return <EditForm article={article} />
}
