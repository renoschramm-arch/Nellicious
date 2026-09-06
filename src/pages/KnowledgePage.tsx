import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KNOWLEDGE_ARTICLES, KNOWLEDGE_CATEGORY_ORDER } from '../lib/knowledgeArticles'

export function KnowledgePage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          {t('common.back')}
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-bold text-2xl">{t('knowledge.title')}</h1>
        <p className="text-text-muted text-sm">{t('knowledge.description')}</p>
      </div>

      {KNOWLEDGE_CATEGORY_ORDER.map((category) => (
        <div key={category} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted px-1">
            {t(`knowledge.categories.${category}`)}
          </h2>
          <div className="bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {KNOWLEDGE_ARTICLES.filter((article) => article.category === category).map((article) => (
              <Link
                key={article.id}
                to={`/mehr/wissen/${article.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors"
              >
                <span className="font-medium text-sm">{t(`knowledge.articles.${article.id}.title`)}</span>
                <span className="text-text-muted" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
