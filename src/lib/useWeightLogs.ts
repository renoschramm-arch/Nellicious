import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import type { Database } from './database.types'

export type WeightLog = Database['public']['Tables']['weight_logs']['Row']

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
