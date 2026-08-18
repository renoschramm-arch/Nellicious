import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { toISODate } from './week'
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

// Für <input type="datetime-local">, das lokale Zeit ohne Zeitzone erwartet.
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function useFasting() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<FastingSession[]>([])
  const [loading, setLoading] = useState(true)
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
    if (!user || activeSession) return
    const { data } = await supabase
      .from('fasting_sessions')
      .insert({ user_id: user.id, target_hours: targetHours, started_at: (startedAt ?? new Date()).toISOString() })
      .select('*')
      .single()
    if (data) setSessions((prev) => [data, ...prev])
  }

  async function stop(endedAt?: Date) {
    if (!activeSession) return
    const { data } = await supabase
      .from('fasting_sessions')
      .update({ ended_at: (endedAt ?? new Date()).toISOString() })
      .eq('id', activeSession.id)
      .select('*')
      .single()
    if (data) setSessions((prev) => prev.map((s) => (s.id === data.id ? data : s)))
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

  const eatingWindow = useMemo(() => {
    if (activeSession || !lastEndedSession) return null
    const endedAtMs = new Date(lastEndedSession.ended_at).getTime()
    const windowHours = 24 - lastEndedSession.target_hours
    const windowEndsAtMs = endedAtMs + windowHours * 3_600_000
    if (nowTick >= windowEndsAtMs) return null
    return {
      totalMs: windowHours * 3_600_000,
      remainingMs: windowEndsAtMs - nowTick,
      endsAt: new Date(windowEndsAtMs).toISOString(),
    }
  }, [activeSession, lastEndedSession, nowTick])

  return { sessions, activeSession, loading, start, stop, streak, reload, now: nowTick, eatingWindow }
}
