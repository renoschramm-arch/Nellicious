import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const navItems = [
  { to: '/', label: 'Heute', end: true },
  { to: '/rezepte', label: 'Rezepte' },
  { to: '/plan', label: 'Plan' },
  { to: '/profil', label: 'Profil' },
]

export function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-xl">
              Nelli<span className="text-primary">cious</span>
            </span>
            <span className="text-xs text-text-muted">Gesund ernähren</span>
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
              className="px-3 py-1.5 rounded-full text-sm font-medium text-text-muted hover:text-text"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 pt-8 pb-28 sm:pb-8">
        <Outlet />
      </main>
      <nav className="sm:hidden fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-stretch justify-around gap-1.5 px-2.5 py-2.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex items-center justify-center py-3 rounded-full text-base font-semibold transition-colors ${
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
