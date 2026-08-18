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

export function useFasting() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<FastingSession[]>([])
  const [loading, setLoading] = useState(true)

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

  async function start(targetHours: number) {
    if (!user || activeSession) return
    const { data } = await supabase
      .from('fasting_sessions')
      .insert({ user_id: user.id, target_hours: targetHours })
      .select('*')
      .single()
    if (data) setSessions((prev) => [data, ...prev])
  }

  async function stop() {
    if (!activeSession) return
    const { data } = await supabase
      .from('fasting_sessions')
      .update({ ended_at: new Date().toISOString() })
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

  return { sessions, activeSession, loading, start, stop, streak, reload }
}
