import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthContext'
import { PageFlatlay } from '../components/PageFlatlay'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { resetPasswordForEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await resetPasswordForEmail(email)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <PageFlatlay file="auth.png" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display font-bold text-2xl">
            Nelli<span className="text-primary">cious</span>
          </span>
          <p className="text-text-muted text-sm mt-2">{t('auth.resetPasswordTitle')}</p>
        </div>

        {sent ? (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-[var(--shadow)] flex flex-col gap-3 text-center">
            <p className="text-sm text-text">{t('auth.resetPasswordSent')}</p>
            <p className="text-xs text-text-muted">{t('auth.checkSpam')}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-border rounded-2xl p-6 shadow-[var(--shadow)] flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              {t('auth.email')}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 bg-primary text-on-primary font-semibold rounded-xl py-2.5 disabled:opacity-60"
            >
              {t('auth.sendResetLink')}
            </button>
          </form>
        )}

        <div className="flex justify-center mt-4">
          <Link
            to="/anmelden"
            className="text-center text-sm text-text-muted hover:text-text bg-surface/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-[var(--shadow)] transition-colors"
          >
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}
