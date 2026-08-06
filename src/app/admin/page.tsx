import Link from 'next/link'
import { db } from '@/lib/db/client'
import ArticleStatusBadge from '@/components/admin/ArticleStatusBadge'

export const dynamic = 'force-dynamic'

export default async function AdminArticleListPage() {
  const allArticles = await db.query.articles.findMany({
    with: { translations: true },
    orderBy: (articles, { desc }) => [desc(articles.updatedAt)],
  })

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-bg-dark">Artikel Blog</h1>
        <Link
          href="/admin/new"
          className="rounded bg-accent px-4 py-2 font-sans font-bold text-text-on-dark hover:bg-accent-hover"
        >
          + Artikel Baru
        </Link>
      </div>

      {allArticles.length === 0 ? (
        <p className="text-text-muted">Belum ada artikel.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-sm text-text-muted">
              <th className="py-2 pr-4">Judul</th>
              <th className="py-2 pr-4">Tag</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Diperbarui</th>
            </tr>
          </thead>
          <tbody>
            {allArticles.map((article) => {
              const idTranslation = article.translations.find((t) => t.locale === 'id')
              const title = idTranslation?.title ?? article.translations[0]?.title ?? '(tanpa judul)'
              return (
                <tr key={article.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/${article.id}`} className="font-sans text-bg-dark hover:text-accent">
                      {title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-text-muted">{article.tags.join(', ') || '-'}</td>
                  <td className="py-3 pr-4">
                    <ArticleStatusBadge status={article.status} />
                  </td>
                  <td className="py-3 text-sm text-text-muted">
                    {new Date(article.updatedAt).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}
