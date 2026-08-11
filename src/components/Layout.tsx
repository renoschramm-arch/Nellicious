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
          <span className="font-display font-bold text-xl">
            Nelli<span className="text-primary">cious</span>
          </span>
          <nav className="flex items-center gap-1">
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
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-text-muted hover:text-text"
            >
              Abmelden
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
