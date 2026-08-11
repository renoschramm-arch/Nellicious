import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import type { Database } from './database.types'

export type MealSlot = Database['public']['Tables']['meal_plan_entries']['Row']['meal_slot']
type PlanEntry = Database['public']['Tables']['meal_plan_entries']['Row']

export function useMealPlan(weekStartISO: string, weekEndISO: string) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<PlanEntry[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('meal_plan_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('plan_date', weekStartISO)
      .lte('plan_date', weekEndISO)
    setEntries(data ?? [])
    setLoading(false)
  }, [user, weekStartISO, weekEndISO])

  useEffect(() => {
    reload()
  }, [reload])

  async function setEntry(planDate: string, mealSlot: MealSlot, recipeId: string) {
    if (!user) return
    const { data } = await supabase
      .from('meal_plan_entries')
      .upsert(
        { user_id: user.id, plan_date: planDate, meal_slot: mealSlot, recipe_id: recipeId },
        { onConflict: 'user_id,plan_date,meal_slot' },
      )
      .select('*')
      .single()
    if (data) {
      setEntries((prev) => [
        ...prev.filter((e) => !(e.plan_date === planDate && e.meal_slot === mealSlot)),
        data,
      ])
    }
  }

  async function removeEntry(id: string) {
    await supabase.from('meal_plan_entries').delete().eq('id', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, setEntry, removeEntry }
}
