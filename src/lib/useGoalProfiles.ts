import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import type { Database } from './database.types'

export type GoalProfile = Database['public']['Tables']['goal_profiles']['Row']

export function useGoalProfiles() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<GoalProfile[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('goal_profiles')
      .select('*')
      .order('created_at', { ascending: true })
    setProfiles(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  async function createProfile(values: {
    name: string
    daily_kcal_goal: number
    daily_protein_goal: number
    daily_carbs_goal: number
    daily_fat_goal: number
    goal: GoalProfile['goal']
  }) {
    if (!user) return null
    const { data, error } = await supabase
      .from('goal_profiles')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (data) setProfiles((prev) => [...prev, data])
    return { data: data ?? null, error: error?.message ?? null }
  }

  async function removeProfile(id: string) {
    await supabase.from('goal_profiles').delete().eq('id', id)
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }

  // Übernimmt die Werte eines gespeicherten Ziel-Profils in die tatsächlich
  // wirksamen profiles.daily_*_goal-Spalten (single source of truth für
  // Dashboard-Ring, Rezept-Logging etc.) und markiert es als aktiv.
  async function activateProfile(profile: GoalProfile) {
    if (!user) return
    await supabase
      .from('profiles')
      .update({
        daily_kcal_goal: profile.daily_kcal_goal,
        daily_protein_goal: profile.daily_protein_goal,
        daily_carbs_goal: profile.daily_carbs_goal,
        daily_fat_goal: profile.daily_fat_goal,
        goal: profile.goal,
        active_goal_profile_id: profile.id,
      })
      .eq('id', user.id)
  }

  return { profiles, loading, createProfile, removeProfile, activateProfile, reload }
}
