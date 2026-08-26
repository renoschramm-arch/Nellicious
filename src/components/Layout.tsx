import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthContext'

export function Layout() {
  const { t } = useTranslation()
  const { signOut } = useAuth()

  const navItems = [
    { to: '/', label: t('nav.today'), end: true },
    { to: '/rezepte', label: t('nav.recipes') },
    { to: '/plan', label: t('nav.plan') },
    { to: '/verlauf', label: t('nav.history') },
    { to: '/mehr', label: t('nav.more') },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-xl">
              Nelli<span className="text-primary">cious</span>
            </span>
            <span className="text-xs text-text-muted">{t('info.tagline')}</span>
          </div>
          <div className="flex items-center gap-1">
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'text-text-muted hover:text-text'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => signOut()}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text"
              aria-label={t('nav.signOut')}
              title={t('nav.signOut')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 3v8" />
                <path d="M6.3 6.3a9 9 0 1 0 11.4 0" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 pt-8 pb-24 sm:pb-8">
        <Outlet />
      </main>
      <nav className="sm:hidden fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-1 px-2.5 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-center px-3.5 py-3.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'text-text-muted hover:text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
