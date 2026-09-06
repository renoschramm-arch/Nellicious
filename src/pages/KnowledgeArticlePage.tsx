import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KNOWLEDGE_ARTICLES } from '../lib/knowledgeArticles'

export function KnowledgeArticlePage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const article = KNOWLEDGE_ARTICLES.find((a) => a.id === id)

  if (!article) return <Navigate to="/mehr/wissen" replace />

  const paragraphs = t(`knowledge.articles.${article.id}.body`, { returnObjects: true }) as string[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr/wissen"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          {t('common.back')}
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t(`knowledge.categories.${article.category}`)}
        </span>
        <h1 className="font-display font-bold text-2xl">{t(`knowledge.articles.${article.id}.title`)}</h1>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3 text-sm text-text leading-relaxed">
        {paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}
