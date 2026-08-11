import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
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
