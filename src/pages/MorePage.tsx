import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthContext'
import { usePremium } from '../lib/usePremium'
import { PageFlatlay } from '../components/PageFlatlay'

export function MorePage() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { trialActive, trialDaysLeft, isPaidPremium, isGrandfathered } = usePremium()

  const MENU_ITEMS = [
    { to: '/mehr/profil', label: t('more.profileLabel'), description: t('more.profileDesc') },
    { to: '/mehr/ziele', label: t('more.goalsLabel'), description: t('more.goalsDesc') },
    { to: '/mehr/tagesziele', label: t('more.dailyGoalsLabel'), description: t('more.dailyGoalsDesc') },
    { to: '/mehr/auswertung', label: t('more.auswertungLabel'), description: t('more.auswertungDesc') },
    { to: '/mehr/darstellung', label: t('more.darstellungLabel'), description: t('more.darstellungDesc') },
    { to: '/mehr/neu', label: t('more.changelogLabel'), description: t('more.changelogDesc') },
    { to: '/mehr/info', label: t('more.infoLabel'), description: t('more.infoDesc') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="profile.jpg" />
      <div>
        <h1 className="font-display font-bold text-2xl">{t('more.title')}</h1>
        <p className="text-text-muted text-sm mt-1">{user?.email}</p>
      </div>

      {(isPaidPremium || isGrandfathered) && (
        <div className="bg-honey/15 backdrop-blur-sm border border-honey/30 rounded-2xl px-4 py-3 text-sm font-medium text-honey">
          {isGrandfathered ? t('more.premiumActiveGrandfathered') : t('more.premiumActive')}
        </div>
      )}
      {trialActive && (
        <div className="bg-honey/15 backdrop-blur-sm border border-honey/30 rounded-2xl px-4 py-3 text-sm text-honey">
          {t('more.trialActive', { count: trialDaysLeft })}
        </div>
      )}

      <nav className="bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors"
          >
            <span className="flex flex-col">
              <span className="font-medium">{item.label}</span>
              <span className="text-xs text-text-muted">{item.description}</span>
            </span>
            <span className="text-text-muted" aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut()}
        className="border border-border bg-surface/80 backdrop-blur-sm rounded-xl py-2.5 text-sm text-text-muted"
      >
        {t('nav.signOut')}
      </button>
    </div>
  )
}
