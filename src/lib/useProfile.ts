import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import type { Database } from './database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) {
      setProfile(data)
    } else {
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: user.id })
        .select('*')
        .single()
      setProfile(created ?? null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  async function updateGoals(goals: ProfileUpdate) {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .update(goals)
      .eq('id', user.id)
      .select('*')
      .single()
    if (data) setProfile(data)
  }

  return { profile, loading, updateGoals, reload }
}
