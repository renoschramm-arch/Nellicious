import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Lädt …
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/anmelden" replace />
  }

  return <Outlet />
}
