import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// Supabase erlaubt eine feste Session-Höchstdauer ("Time-box user sessions")
// nur im Pro-Plan. Ohne die läuft eine einmal angemeldete Session über das
// Refresh-Token unbegrenzt im Hintergrund weiter, ohne dass je ein neuer
// Login-Event entsteht. Dieser Zeitstempel bildet den fehlenden Pro-Plan-
// Schalter nach und erzwingt 24h danach eine erneute Anmeldung.
//
// Wird bewusst NICHT über das generische onAuthStateChange('SIGNED_IN', ...)
// gesetzt: @supabase/auth-js feuert dieses Event auch beim bloßen
// Wiederherstellen einer bestehenden Sitzung aus dem Storage bei jedem
// App-Start/Reload, solange das Access-Token noch nicht abgelaufen ist (das
// dafür eigentlich vorgesehene 'INITIAL_SESSION' läuft parallel dazu, ersetzt
// 'SIGNED_IN' aber nicht) — würde man darauf reagieren, setzte praktisch
// jedes erneute Öffnen der App den Timer zurück und die 24h-Schwelle würde
// nie erreicht. Der Zeitstempel wird deshalb ausschließlich direkt nach
// einem erfolgreichen signInWithPassword()-Aufruf gesetzt, dem einzigen Weg
// zurück in die App nach einer erzwungenen Abmeldung.
const LOGIN_AT_KEY = 'nellicious_login_at'
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(LOGIN_AT_KEY)
      }
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Erzwingt die 24h-Session-Höchstdauer aus dem Kommentar oben. Prüft bei
  // jeder neuen Session, in Intervallen und wenn die App wieder in den
  // Vordergrund kommt (PWA bleibt sonst oft tagelang im Hintergrund geöffnet).
  useEffect(() => {
    if (!session) return

    function checkSessionAge() {
      const loginAt = Number(localStorage.getItem(LOGIN_AT_KEY) ?? 0)
      if (!loginAt) {
        // Session bestand schon vor Einführung dieser Prüfung (oder
        // localStorage wurde geleert) — Zeitpunkt jetzt setzen statt sofort
        // auszuloggen.
        localStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
        return
      }
      if (Date.now() - loginAt > SESSION_MAX_AGE_MS) {
        supabase.auth.signOut()
      }
    }

    checkSessionAge()
    const interval = setInterval(checkSessionAge, 5 * 60 * 1000)
    document.addEventListener('visibilitychange', checkSessionAge)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', checkSessionAge)
    }
  }, [session])

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) localStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}anmelden`,
      },
    })
    return { error: error?.message ?? null }
  }

  async function resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}passwort-neu`,
    })
    return { error: error?.message ?? null }
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithPassword,
        signUp,
        resetPasswordForEmail,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden')
  return ctx
}
