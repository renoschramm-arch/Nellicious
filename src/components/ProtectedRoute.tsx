import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Lädt …
      </div>
    )
  }

  if (!session) {
    // Der Startpunkt "/" führt neue, nicht angemeldete Besucher:innen erst
    // zur Landingpage — tiefere Links (z. B. geteilte Rezepte) weiterhin
    // direkt zur Anmeldung.
    if (location.pathname === '/') return <Navigate to="/willkommen" replace />
    return <Navigate to="/anmelden" replace />
  }

  return <Outlet />
}
