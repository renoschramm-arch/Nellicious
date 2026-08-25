import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="bg-honey/20 text-honey font-mono text-[0.9em] rounded px-1.5 py-0.5">
      {children}
    </span>
  )
}

export function LegalPageLayout({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/willkommen" className="font-display font-bold text-lg">
            Nelli<span className="text-primary">cious</span>
          </Link>
          <Link to="/willkommen" className="text-sm text-text-muted hover:text-text">
            {t('legalPageLayout.back')}
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-8">
        <div>
          <h1 className="font-display font-semibold text-3xl mb-2">{title}</h1>
          <p className="text-xs text-text-muted bg-surface-2 border border-border rounded-lg px-3 py-2 inline-block">
            {t('legalPageLayout.templateNoticeBefore')}{' '}
            <span className="bg-honey/20 text-honey font-mono rounded px-1">{t('legalPageLayout.marked')}</span>{' '}
            {t('legalPageLayout.templateNoticeAfter')}
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm leading-relaxed text-text-muted [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:text-text [&_h2]:mt-2 [&_strong]:text-text [&_a]:text-primary [&_a]:hover:underline [&_ul]:list-disc [&_ul]:list-inside [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1">
          {children}
        </div>
      </main>
    </div>
  )
}
