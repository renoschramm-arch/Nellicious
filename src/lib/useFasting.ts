import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { toISODate } from './week'
import { getIntlLocale } from './i18n'
import type { Database } from './database.types'

export type FastingSession = Database['public']['Tables']['fasting_sessions']['Row']

// Fastenfenster : Essfenster (z. B. 16 -> "16:8").
export function fastingProtocolLabel(hours: number): string {
  return `${hours}:${24 - hours}`
}

// Sehr kurze Essfenster (<= 1h) entsprechen dem geläufig als "OMAD"
// (One Meal A Day) bezeichneten Protokoll.
export function isOmad(hours: number): boolean {
  return 24 - hours <= 1
}

export function formatDurationHM(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m}m`
}

// Für Countdowns, z. B. "03:24" statt "3h 24m".
export function formatCountdownHM(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatClockTime(date: Date): string {
  return new Intl.DateTimeFormat(getIntlLocale(), { hour: '2-digit', minute: '2-digit' }).format(date)
}

// Für <input type="datetime-local">, das lokale Zeit ohne Zeitzone erwartet.
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export interface FastingPhase {
  fromH: number
  toH: number
  range: string
  title: string
  text: string
}

// Grobe, vereinfachte Orientierung, was im Körper während des Fastens
// passiert — keine medizinische Beratung, nur zur Einordnung im UI.
export function getFastingPhases(t: TFunction): FastingPhase[] {
  return [
    {
      fromH: 0,
      toH: 4,
      range: t('fastingPhases.rangeFixed', { from: 0, to: 4 }),
      title: t('fastingPhases.phase1Title'),
      text: t('fastingPhases.phase1Text'),
    },
    {
      fromH: 4,
      toH: 12,
      range: t('fastingPhases.rangeFixed', { from: 4, to: 12 }),
      title: t('fastingPhases.phase2Title'),
      text: t('fastingPhases.phase2Text'),
    },
    {
      fromH: 12,
      toH: 18,
      range: t('fastingPhases.rangeFixed', { from: 12, to: 18 }),
      title: t('fastingPhases.phase3Title'),
      text: t('fastingPhases.phase3Text'),
    },
    {
      fromH: 18,
      toH: Infinity,
      range: t('fastingPhases.rangeFrom', { from: 18 }),
      title: t('fastingPhases.phase4Title'),
      text: t('fastingPhases.phase4Text'),
    },
  ]
}

export function getFastingPhase(t: TFunction, elapsedHours: number): FastingPhase | null {
  return getFastingPhases(t).find((p) => elapsedHours >= p.fromH && elapsedHours < p.toH) ?? null
}

export function useFasting() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<FastingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Läuft durchgehend, damit Fasten-Ring und Essensfenster-Timer in jeder
  // Ansicht (Heute, Verlauf) live weiterlaufen, ohne dass jede Ansicht ihr
  // eigenes Interval verwalten muss.
  const [nowTick, setNowTick] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - 30)
    since.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: false })
    setSessions(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  const activeSession = sessions.find((s) => s.ended_at === null) ?? null

  // startedAt/endedAt optional, damit ein vergessenes Starten/Beenden auch
  // rückwirkend nachgetragen werden kann (statt nur "jetzt").
  async function start(targetHours: number, startedAt?: Date) {
    if (!user) {
      setError('Nicht angemeldet — bitte Seite neu laden.')
      return
    }
    if (activeSession) {
      setError(`Es läuft bereits ein Fasten seit ${new Date(activeSession.started_at).toLocaleString(getIntlLocale())}.`)
      return
    }
    setError(null)
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .insert({ user_id: user.id, target_hours: targetHours, started_at: (startedAt ?? new Date()).toISOString() })
      .select('*')
      .single()
    if (err) {
      console.error('fasting_sessions insert failed', err)
      setError(err.message)
      return
    }
    if (data) setSessions((prev) => [data, ...prev])
  }

  async function stop(endedAt?: Date) {
    if (!activeSession) return
    setError(null)
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .update({ ended_at: (endedAt ?? new Date()).toISOString() })
      .eq('id', activeSession.id)
      .select('*')
      .single()
    if (err) {
      console.error('fasting_sessions update failed', err)
      setError(err.message)
      return
    }
    if (data) setSessions((prev) => prev.map((s) => (s.id === data.id ? data : s)))
  }

  // Nachträgliche Korrektur von Start/Ende/Zielstunden eines bereits
  // geloggten (oder gerade laufenden) Eintrags — im Gegensatz zu start/stop,
  // die nur zum Beginnen/Beenden einer neuen bzw. der aktuell laufenden
  // Session dienen.
  async function updateSession(
    id: string,
    patch: { started_at?: Date; ended_at?: Date | null; target_hours?: number },
  ) {
    setError(null)
    const dbPatch: { started_at?: string; ended_at?: string | null; target_hours?: number } = {}
    if (patch.started_at) dbPatch.started_at = patch.started_at.toISOString()
    if ('ended_at' in patch) dbPatch.ended_at = patch.ended_at ? patch.ended_at.toISOString() : null
    if (patch.target_hours != null) dbPatch.target_hours = patch.target_hours
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .update(dbPatch)
      .eq('id', id)
      .select('*')
      .single()
    if (err) {
      console.error('fasting_sessions update failed', err)
      setError(err.message)
      return
    }
    if (data) setSessions((prev) => prev.map((s) => (s.id === data.id ? data : s)))
  }

  async function deleteSession(id: string) {
    setError(null)
    const { error: err } = await supabase.from('fasting_sessions').delete().eq('id', id)
    if (err) {
      console.error('fasting_sessions delete failed', err)
      setError(err.message)
      return
    }
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  // Tage, an denen ein beendetes Fasten die eigene Zieldauer erreicht oder
  // überschritten hat — gruppiert nach dem Datum, an dem es begonnen hat.
  const successfulDays = useMemo(() => {
    const days = new Set<string>()
    for (const s of sessions) {
      if (!s.ended_at) continue
      const durationHours = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 3_600_000
      if (durationHours >= s.target_hours) {
        days.add(toISODate(new Date(s.started_at)))
      }
    }
    return days
  }, [sessions])

  // Gleiche Logik wie useLoggingStreak: reißt erst, wenn ein ganzer Tag
  // ausgelassen wird, nicht schon während des laufenden, noch offenen Tages.
  const streak = useMemo(() => {
    const cursor = new Date()
    if (!successfulDays.has(toISODate(cursor))) {
      cursor.setDate(cursor.getDate() - 1)
    }
    let count = 0
    while (successfulDays.has(toISODate(cursor))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [successfulDays])

  // Die zuletzt beendete Session bestimmt das aktuelle Essensfenster
  // (Fensterdauer = 24h - Fastenziel dieser Session).
  const lastEndedSession = useMemo(() => {
    return (
      sessions
        .filter((s): s is FastingSession & { ended_at: string } => s.ended_at !== null)
        .sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime())[0] ?? null
    )
  }, [sessions])

  // remainingMs kann negativ werden, sobald das Essensfenster überzogen
  // wird — es bleibt bewusst offen, bis das nächste Fasten gestartet wird,
  // statt bei Ablauf zu verschwinden (gleiche Regel wie beim Fasten selbst).
  const eatingWindow = useMemo(() => {
    if (activeSession || !lastEndedSession) return null
    const endedAtMs = new Date(lastEndedSession.ended_at).getTime()
    const windowHours = 24 - lastEndedSession.target_hours
    const windowEndsAtMs = endedAtMs + windowHours * 3_600_000
    return {
      totalMs: windowHours * 3_600_000,
      remainingMs: windowEndsAtMs - nowTick,
      endsAt: new Date(windowEndsAtMs).toISOString(),
    }
  }, [activeSession, lastEndedSession, nowTick])

  return {
    sessions,
    activeSession,
    loading,
    start,
    stop,
    updateSession,
    deleteSession,
    streak,
    reload,
    now: nowTick,
    eatingWindow,
    error,
  }
}

// Für Trend-Charts — im Unterschied zu useFasting oben nicht auf die
// letzten 30 Tage begrenzt, sondern über einen frei wählbaren Zeitraum.
export function useFastingHistory(days: number) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<FastingSession[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - (days - 1))
    since.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: true })
    setSessions(data ?? [])
    setLoading(false)
  }, [user, days])

  useEffect(() => {
    reload()
  }, [reload])

  return { sessions, loading, reload }
}
