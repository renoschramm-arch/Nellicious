import { Link } from 'react-router-dom'
import { useFasting, formatDurationHM } from '../lib/useFasting'

// Nur sichtbar, während tatsächlich gefastet wird oder ein Essensfenster
// läuft — Nutzer, die die Funktion nicht verwenden, sehen hier nichts.
export function FastingRingCard() {
  const { activeSession, eatingWindow, now } = useFasting()

  if (!activeSession && !eatingWindow) return null

  const elapsedMs = activeSession ? now - new Date(activeSession.started_at).getTime() : 0
  const targetMs = activeSession ? activeSession.target_hours * 3_600_000 : (eatingWindow?.totalMs ?? 0)
  const progressMs = activeSession ? elapsedMs : (eatingWindow ? eatingWindow.totalMs - eatingWindow.remainingMs : 0)
  const pct = targetMs > 0 ? Math.min(100, Math.round((progressMs / targetMs) * 100)) : 0
  const ringDeg = (pct / 100) * 360
  const ringColor = activeSession ? 'var(--basil)' : 'var(--honey)'

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
        {activeSession ? (
          <>
            ⏱️ Fastet seit
            <span className="block font-mono font-medium text-base text-basil">
              {formatDurationHM(elapsedMs)} <span className="text-text-muted">/ {activeSession.target_hours}h Ziel</span>
            </span>
          </>
        ) : (
          <>
            🍽️ Essensfenster
            <span className="block font-mono font-medium text-base text-honey">
              noch {formatDurationHM(eatingWindow!.remainingMs)}
            </span>
          </>
        )}
      </div>
    </Link>
  )
}
