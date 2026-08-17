import { useMemo } from 'react'
import { useProfile, type Profile } from './useProfile'

export const PREMIUM_TRIAL_DAYS = 14

// Der eigentliche Startschalter für Premium. Solange dieser Wert `null`
// ist oder in der Zukunft liegt, ist die Freischaltung komplett
// deaktiviert — ALLE Nutzer haben vollen Zugriff, unabhängig von
// Testphase oder Bezahlstatus. So kann der Premium-Code schon deployed
// werden, ohne live etwas zu sperren.
//
// Zum tatsächlichen Start: ISO-Datum eintragen (z. B. '2026-09-01') und
// deployen — ab dann greift die Sperre.
//
// Bestandsnutzer-Schutz: Wer sein Konto VOR diesem Datum angelegt hat,
// bleibt für immer Premium (Dank an die frühen Nutzer) — nur wer sich
// danach registriert, durchläuft die normale Testphase und braucht
// anschließend ein bezahltes Abo.
export const PREMIUM_LAUNCH_AT: string | null = null

const DAY_MS = 24 * 60 * 60 * 1000

export interface PremiumStatus {
  loading: boolean
  // Zahlender Premium-Status laut Profil (gesetzt von einer künftigen
  // Zahlungsanbindung über den service_role-Key, siehe protect_premium_fields
  // in schema.sql).
  isPaidPremium: boolean
  // Konto existierte schon vor dem Premium-Start — dauerhaft freigeschaltet,
  // unabhängig von Testphase oder Bezahlstatus.
  isGrandfathered: boolean
  // Kostenlose Testphase ab Kontoerstellung, solange weder zahlendes
  // Premium noch Bestandsschutz greift.
  trialActive: boolean
  trialDaysLeft: number
  // Ob Premium-Funktionen aktuell freigeschaltet sind (Bestandsschutz,
  // bezahlt, Testphase oder Schalter noch nicht aktiv).
  hasPremium: boolean
}

function computeStatus(profile: Profile | null): Omit<PremiumStatus, 'loading'> {
  if (!profile) {
    return { isPaidPremium: false, isGrandfathered: false, trialActive: false, trialDaysLeft: 0, hasPremium: false }
  }

  const now = Date.now()
  const launchAt = PREMIUM_LAUNCH_AT ? new Date(PREMIUM_LAUNCH_AT).getTime() : null

  // Schalter noch nicht umgelegt: keine Sperren, für niemanden.
  if (launchAt === null || now < launchAt) {
    return { isPaidPremium: false, isGrandfathered: false, trialActive: false, trialDaysLeft: 0, hasPremium: true }
  }

  const createdAt = new Date(profile.created_at).getTime()
  const isGrandfathered = createdAt < launchAt

  const isPaidPremium =
    profile.is_premium && (!profile.premium_until || new Date(profile.premium_until).getTime() > now)

  const trialEndsAt = createdAt + PREMIUM_TRIAL_DAYS * DAY_MS
  const trialActive = !isGrandfathered && !isPaidPremium && now < trialEndsAt
  const trialDaysLeft = trialActive ? Math.max(1, Math.ceil((trialEndsAt - now) / DAY_MS)) : 0

  return {
    isPaidPremium,
    isGrandfathered,
    trialActive,
    trialDaysLeft,
    hasPremium: isGrandfathered || isPaidPremium || trialActive,
  }
}

export function usePremium(): PremiumStatus {
  const { profile, loading } = useProfile()
  return useMemo(() => ({ ...computeStatus(profile), loading }), [profile, loading])
}
