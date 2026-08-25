import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { toISODate } from './week'
import type { Database } from './database.types'

export type WeightLog = Database['public']['Tables']['weight_logs']['Row']

export function formatWeightKg(kg: number): string {
  return kg.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// Erlaubt sowohl "75,5" als auch "75.5" als Eingabe.
export function parseWeightKg(input: string): number | null {
  const normalized = input.trim().replace(',', '.')
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function useWeightLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(30)
    setLogs(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  async function upsertWeight(logDate: string, weightKg: number) {
    if (!user) return
    await supabase
      .from('weight_logs')
      .upsert({ user_id: user.id, log_date: logDate, weight_kg: weightKg }, { onConflict: 'user_id,log_date' })
    await reload()
  }

  async function deleteWeight(id: string) {
    await supabase.from('weight_logs').delete().eq('id', id)
    setLogs((prev) => prev.filter((log) => log.id !== id))
  }

  return { logs, loading, upsertWeight, deleteWeight, reload }
}

// Für Trend-Charts — im Unterschied zu useWeightLogs oben nicht auf die
// letzten 30 Einträge begrenzt, sondern über einen frei wählbaren Zeitraum
// von Tagen zurück, aufsteigend sortiert (passend für einen Linienchart).
export function useWeightLogHistory(days: number) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', toISODate(start))
      .lte('log_date', toISODate(end))
      .order('log_date', { ascending: true })
    setLogs(data ?? [])
    setLoading(false)
  }, [user, days])

  useEffect(() => {
    reload()
  }, [reload])

  return { logs, loading, reload }
}
