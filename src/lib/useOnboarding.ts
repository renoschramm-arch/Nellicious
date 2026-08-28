import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProfile } from './useProfile'

// Neue Nutzer:innen landen nach der Registrierung sonst direkt auf der
// leeren Heute-Seite und müssten von sich aus zu Profil/Ziel/Tagesziele
// navigieren, um Angaben zu machen. Beim ersten Erreichen einer
// geschützten Seite mit noch komplett leerem Profil (kein Name, kein
// Ernährungstyp, kein Ziel — so wie das automatisch angelegte Profil
// direkt nach der Registrierung aussieht) wird deshalb einmalig durch
// Mein Profil → Mein Ziel → Tagesziele geleitet. Der Sitzungs-Flag
// verhindert ein erneutes Auslösen, unabhängig davon, ob der Durchlauf
// abgeschlossen oder z. B. über "Zurück" übersprungen wurde.
const SEEN_KEY_PREFIX = 'nellicious-onboarding-seen:'
const ONBOARDING_PATHS = ['/mehr/profil', '/mehr/ziele', '/mehr/tagesziele']

export interface OnboardingState {
  onboarding: true
  onboardingNext: string
}

export function useOnboardingRedirect() {
  const { profile, loading } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || !profile) return
    const seenKey = SEEN_KEY_PREFIX + profile.id
    if (localStorage.getItem(seenKey)) return
    if (ONBOARDING_PATHS.includes(location.pathname)) return

    localStorage.setItem(seenKey, '1')

    const isEmpty = !profile.display_name && !profile.nutrition_type && !profile.goal
    if (!isEmpty) return

    const state: OnboardingState = { onboarding: true, onboardingNext: '/mehr/ziele' }
    navigate('/mehr/profil', { state })
  }, [loading, profile, location.pathname, navigate])
}
