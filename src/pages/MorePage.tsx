import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { usePremium } from '../lib/usePremium'
import { PageFlatlay } from '../components/PageFlatlay'

const MENU_ITEMS = [
  { to: '/mehr/profil', label: 'Mein Profil', description: 'Name, Ernährungstyp, Aktivitätslevel' },
  { to: '/mehr/ziele', label: 'Ziele', description: 'Was du erreichen möchtest' },
  { to: '/mehr/tagesziele', label: 'Tagesziele', description: 'kcal, Protein, Kohlenhydrate, Fett' },
  { to: '/mehr/darstellung', label: 'Darstellung', description: 'System, Hell oder Dunkel' },
  { to: '/mehr/info', label: 'Info', description: 'Über Nellicious' },
]

export function MorePage() {
  const { user, signOut } = useAuth()
  const { trialActive, trialDaysLeft, isPaidPremium } = usePremium()

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="profile.jpg" />
      <div>
        <h1 className="font-display font-bold text-2xl">Mehr</h1>
        <p className="text-text-muted text-sm mt-1">{user?.email}</p>
      </div>

      {isPaidPremium && (
        <div className="bg-honey/10 border border-honey/30 rounded-2xl px-4 py-3 text-sm font-medium text-honey">
          ⭐ Nellicious Premium aktiv
        </div>
      )}
      {trialActive && (
        <div className="bg-honey/10 border border-honey/30 rounded-2xl px-4 py-3 text-sm text-honey">
          🎁 Premium-Testphase: noch {trialDaysLeft} {trialDaysLeft === 1 ? 'Tag' : 'Tage'}
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
        Abmelden
      </button>
    </div>
  )
}
