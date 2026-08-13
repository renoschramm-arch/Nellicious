import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useTheme, type ThemePreference } from '../lib/theme'
import { PageFlatlay } from '../components/PageFlatlay'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
]

const MENU_ITEMS = [
  { to: '/mehr/profil', label: 'Mein Profil', description: 'Name, Ernährungstyp, Aktivitätslevel' },
  { to: '/mehr/ziele', label: 'Ziele', description: 'Was du erreichen möchtest' },
  { to: '/mehr/tagesziele', label: 'Tagesziele', description: 'kcal, Protein, Kohlenhydrate, Fett' },
]

export function MorePage() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="profile.jpg" />
      <div>
        <h1 className="font-display font-bold text-2xl">Mehr</h1>
        <p className="text-text-muted text-sm mt-1">{user?.email}</p>
      </div>

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

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="font-display font-semibold text-lg">Darstellung</h2>
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-primary text-on-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="border border-border bg-surface/80 backdrop-blur-sm rounded-xl py-2.5 text-sm text-text-muted"
      >
        Abmelden
      </button>
    </div>
  )
}
