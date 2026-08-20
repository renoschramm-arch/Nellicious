import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { PageFlatlay } from '../components/PageFlatlay'

export function AuthPage() {
  const { session, signInWithPassword, signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const result =
      mode === 'signin' ? await signInWithPassword(email, password) : await signUp(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (mode === 'signup') {
      setInfo('Konto erstellt. Bitte bestätige deine E-Mail-Adresse, falls gefordert, und melde dich an.')
      setMode('signin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <PageFlatlay file="auth.png" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display font-bold text-2xl">
            Nelli<span className="text-primary">cious</span>
          </span>
          <p className="text-text-muted text-sm mt-2">
            {mode === 'signin' ? 'Willkommen zurück.' : 'Leg los mit gesunder Ernährung.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-6 shadow-[var(--shadow)] flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            E-Mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Passwort
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-basil">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 bg-primary text-on-primary font-semibold rounded-xl py-2.5 disabled:opacity-60"
          >
            {mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setInfo(null)
            }}
            className="text-center text-sm text-text-muted hover:text-text bg-surface/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-[var(--shadow)] transition-colors"
          >
            {mode === 'signin' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Anmelden'}
          </button>
        </div>
      </div>
    </div>
  )
}
