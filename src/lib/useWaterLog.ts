import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import { toISODate } from './week'
import type { Database } from './database.types'

export type WaterLog = Database['public']['Tables']['water_logs']['Row']

export function useWaterLog() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = toISODate(new Date())

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('water_logs')
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

  const todayMl = logs.find((log) => log.log_date === today)?.amount_ml ?? 0

  async function setTodayAmount(amountMl: number) {
    if (!user) return
    const clamped = Math.max(0, amountMl)
    await supabase
      .from('water_logs')
      .upsert({ user_id: user.id, log_date: today, amount_ml: clamped }, { onConflict: 'user_id,log_date' })
    await reload()
  }

  async function addWater(amountMl: number) {
    await setTodayAmount(todayMl + amountMl)
  }

  async function resetWater() {
    await setTodayAmount(0)
  }

  return { logs, todayMl, loading, addWater, resetWater, reload }
}
