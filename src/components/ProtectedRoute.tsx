import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthContext'

export function ProtectedRoute() {
  const { t } = useTranslation()
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        {t('common.loading')}
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
