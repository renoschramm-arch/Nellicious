import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type NutritionType = NonNullable<Profile['nutrition_type']>
export type ActivityLevel = NonNullable<Profile['activity_level']>
export type Goal = NonNullable<Profile['goal']>
export type Gender = NonNullable<Profile['gender']>

export const GENDERS: Gender[] = ['maennlich', 'weiblich', 'divers']

export const GENDER_LABELS: Record<Gender, string> = {
  maennlich: 'Männlich',
  weiblich: 'Weiblich',
  divers: 'Divers',
}

export const NUTRITION_TYPES: NutritionType[] = [
  'omnivore',
  'vegetarisch',
  'vegan',
  'pescetarisch',
  'keto',
  'low_carb',
]

export const NUTRITION_TYPE_LABELS: Record<NutritionType, string> = {
  omnivore: 'Omnivore',
  vegetarisch: 'Vegetarisch',
  vegan: 'Vegan',
  pescetarisch: 'Pescetarisch',
  keto: 'Keto',
  low_carb: 'Low-Carb',
}

export const INTOLERANCES = [
  'laktosefrei',
  'glutenfrei',
  'nussfrei',
  'eifrei',
  'sojafrei',
  'histaminarm',
] as const

export const INTOLERANCE_LABELS: Record<(typeof INTOLERANCES)[number], string> = {
  laktosefrei: 'Laktosefrei',
  glutenfrei: 'Glutenfrei',
  nussfrei: 'Nussfrei',
  eifrei: 'Eifrei',
  sojafrei: 'Sojafrei',
  histaminarm: 'Histaminarm',
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sitzend',
  'leicht_aktiv',
  'maessig_aktiv',
  'sehr_aktiv',
  'extrem_aktiv',
]

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sitzend: 'Sitzend (PAL 1,2) – kaum Bewegung',
  leicht_aktiv: 'Leicht aktiv (PAL 1,375) – Bürojob, wenig Sport',
  maessig_aktiv: 'Mäßig aktiv (PAL 1,55) – 1–3× Sport/Woche',
  sehr_aktiv: 'Sehr aktiv (PAL 1,725) – 4–6× Sport/Woche',
  extrem_aktiv: 'Extrem aktiv (PAL 1,9) – körperliche Arbeit / Leistungssport',
}

export const GOALS: Goal[] = ['abnehmen', 'halten', 'zunehmen', 'muskelaufbau']

export const GOAL_LABELS: Record<Goal, string> = {
  abnehmen: 'Abnehmen',
  halten: 'Gewicht halten',
  zunehmen: 'Zunehmen',
  muskelaufbau: 'Muskelaufbau',
}

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

  async function updateProfile(patch: ProfileUpdate) {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select('*')
      .single()
    if (data) setProfile(data)
  }

  return { profile, loading, updateProfile, reload }
}
