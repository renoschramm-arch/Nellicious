import { useMemo } from 'react'
import { useProfile, type Profile } from './useProfile'

export const PREMIUM_TRIAL_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

export interface PremiumStatus {
  loading: boolean
  // Zahlender Premium-Status laut Profil (gesetzt von einer künftigen
  // Zahlungsanbindung über den service_role-Key, siehe protect_premium_fields
  // in schema.sql).
  isPaidPremium: boolean
  // Kostenlose Testphase ab Kontoerstellung, solange kein zahlendes Premium
  // aktiv ist.
  trialActive: boolean
  trialDaysLeft: number
  // Ob Premium-Funktionen aktuell freigeschaltet sind (bezahlt oder Testphase).
  hasPremium: boolean
}

function computeStatus(profile: Profile | null): Omit<PremiumStatus, 'loading'> {
  if (!profile) {
    return { isPaidPremium: false, trialActive: false, trialDaysLeft: 0, hasPremium: false }
  }

  const now = Date.now()
  const isPaidPremium =
    profile.is_premium && (!profile.premium_until || new Date(profile.premium_until).getTime() > now)

  const trialEndsAt = new Date(profile.created_at).getTime() + PREMIUM_TRIAL_DAYS * DAY_MS
  const trialActive = !isPaidPremium && now < trialEndsAt
  const trialDaysLeft = trialActive ? Math.max(1, Math.ceil((trialEndsAt - now) / DAY_MS)) : 0

  return { isPaidPremium, trialActive, trialDaysLeft, hasPremium: isPaidPremium || trialActive }
}

export function usePremium(): PremiumStatus {
  const { profile, loading } = useProfile()
  return useMemo(() => ({ ...computeStatus(profile), loading }), [profile, loading])
}
