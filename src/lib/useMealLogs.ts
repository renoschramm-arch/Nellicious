import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { toISODate } from './week'
import type { Database } from './database.types'

type MealLog = Database['public']['Tables']['meal_logs']['Row']
type MealLogInsert = Database['public']['Tables']['meal_logs']['Insert']

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function useMealLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { start, end } = todayRange()
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', start)
      .lte('logged_at', end)
      .order('logged_at', { ascending: true })
    setLogs(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  async function addLog(entry: Omit<MealLogInsert, 'user_id'>) {
    if (!user) return
    const { data } = await supabase
      .from('meal_logs')
      .insert({ ...entry, user_id: user.id })
      .select('*')
      .single()
    if (data) setLogs((prev) => [...prev, data])
  }

  async function removeLog(id: string) {
    await supabase.from('meal_logs').delete().eq('id', id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  const totals = logs.reduce(
    (acc, l) => ({
      kcal: acc.kcal + l.kcal,
      protein_g: acc.protein_g + l.protein_g,
      carbs_g: acc.carbs_g + l.carbs_g,
      fat_g: acc.fat_g + l.fat_g,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )

  return { logs, totals, loading, addLog, removeLog }
}

// Für Trend-Charts (z. B. Kalorien-Verlauf) — im Unterschied zu useMealLogs
// oben nicht auf "heute" beschränkt, sondern über einen frei wählbaren
// Zeitraum von Tagen zurück.
export function useMealLogHistory(days: number) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: true })
    setLogs(data ?? [])
    setLoading(false)
  }, [user, days])

  useEffect(() => {
    reload()
  }, [reload])

  return { logs, loading, reload }
}

// Zählt aufeinanderfolgende Tage mit mindestens einem Logeintrag, endend
// bei heute — oder bei gestern, falls heute noch nichts geloggt wurde
// (der Streak reißt erst, wenn ein ganzer Tag ausgelassen wird, nicht
// schon während des laufenden Tages).
export function useLoggingStreak() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - 90)
    since.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('meal_logs')
      .select('logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', since.toISOString())
    const loggedDays = new Set((data ?? []).map((l) => toISODate(new Date(l.logged_at))))

    const cursor = new Date()
    if (!loggedDays.has(toISODate(cursor))) {
      cursor.setDate(cursor.getDate() - 1)
    }
    let count = 0
    while (loggedDays.has(toISODate(cursor))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
    setStreak(count)
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  return { streak, loading, reload }
}
