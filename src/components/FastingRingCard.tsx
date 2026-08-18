import { Link } from 'react-router-dom'
import { useFasting, formatCountdownHM, formatClockTime } from '../lib/useFasting'
import { useProfile } from '../lib/useProfile'

// Nur sichtbar, während tatsächlich gefastet wird oder ein Essensfenster
// läuft — Nutzer, die die Funktion nicht (mehr) verwenden, sehen hier nichts.
export function FastingRingCard() {
  const { profile } = useProfile()
  const { activeSession, eatingWindow, now } = useFasting()

  if (profile?.fasting_enabled === false) return null
  if (!activeSession && !eatingWindow) return null

  const elapsedMs = activeSession ? now - new Date(activeSession.started_at).getTime() : 0
  const targetMs = activeSession ? activeSession.target_hours * 3_600_000 : (eatingWindow?.totalMs ?? 0)
  const progressMs = activeSession ? elapsedMs : (eatingWindow ? eatingWindow.totalMs - eatingWindow.remainingMs : 0)
  const pct = targetMs > 0 ? Math.min(100, Math.round((progressMs / targetMs) * 100)) : 0
  const ringDeg = (pct / 100) * 360
  const ringColor = activeSession ? 'var(--basil)' : 'var(--honey)'
  const fastingEndsAt = activeSession ? new Date(new Date(activeSession.started_at).getTime() + targetMs) : null
  const fastingRemainingMs = fastingEndsAt ? fastingEndsAt.getTime() - now : 0

  return (
    <Link
      to="/verlauf"
      className="bg-surface-2 border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary transition-colors"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `conic-gradient(${ringColor} 0deg ${ringDeg}deg, var(--border) ${ringDeg}deg 360deg)` }}
      >
        <div className="w-10 h-10 rounded-full bg-surface-2" />
      </div>
      <div className="text-sm flex-1">
        {activeSession && fastingEndsAt ? (
          <>
            ⏱️ Fastenzeit endet in
            <span className="block font-mono font-medium text-base text-basil">
              {formatCountdownHM(fastingRemainingMs)} h{' '}
              <span className="text-text-muted">um {formatClockTime(fastingEndsAt)} Uhr</span>
            </span>
          </>
        ) : (
          <>
            🍽️ Fastenzeit beginnt in
            <span className="block font-mono font-medium text-base text-honey">
              {formatCountdownHM(eatingWindow!.remainingMs)} h{' '}
              <span className="text-text-muted">um {formatClockTime(new Date(eatingWindow!.endsAt))} Uhr</span>
            </span>
          </>
        )}
      </div>
    </Link>
  )
}
