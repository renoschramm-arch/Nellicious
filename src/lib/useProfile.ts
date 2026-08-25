import { useCallback, useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type NutritionType = NonNullable<Profile['nutrition_type']>
export type ActivityLevel = NonNullable<Profile['activity_level']>
export type Goal = NonNullable<Profile['goal']>
export type Gender = NonNullable<Profile['gender']>

export const GENDERS: Gender[] = ['maennlich', 'weiblich']

export function getGenderLabels(t: TFunction): Record<Gender, string> {
  return {
    maennlich: t('profile.genderMaennlich'),
    weiblich: t('profile.genderWeiblich'),
  }
}

export const NUTRITION_TYPES: NutritionType[] = [
  'omnivore',
  'vegetarisch',
  'vegan',
  'pescetarisch',
  'keto',
  'low_carb',
]

export function getNutritionTypeLabels(t: TFunction): Record<NutritionType, string> {
  return {
    omnivore: t('profile.nutritionOmnivore'),
    vegetarisch: t('profile.nutritionVegetarisch'),
    vegan: t('profile.nutritionVegan'),
    pescetarisch: t('profile.nutritionPescetarisch'),
    keto: t('profile.nutritionKeto'),
    low_carb: t('profile.nutritionLowCarb'),
  }
}

export function getNutritionTypeDescriptions(t: TFunction): Record<NutritionType, string> {
  return {
    omnivore: t('profile.nutritionOmnivoreDesc'),
    vegetarisch: t('profile.nutritionVegetarischDesc'),
    vegan: t('profile.nutritionVeganDesc'),
    pescetarisch: t('profile.nutritionPescetarischDesc'),
    keto: t('profile.nutritionKetoDesc'),
    low_carb: t('profile.nutritionLowCarbDesc'),
  }
}

export const INTOLERANCES = [
  'laktosefrei',
  'glutenfrei',
  'nussfrei',
  'eifrei',
  'sojafrei',
  'histaminarm',
] as const

export function getIntoleranceLabels(t: TFunction): Record<(typeof INTOLERANCES)[number], string> {
  return {
    laktosefrei: t('profile.intoleranceLaktosefrei'),
    glutenfrei: t('profile.intoleranceGlutenfrei'),
    nussfrei: t('profile.intoleranceNussfrei'),
    eifrei: t('profile.intoleranceEifrei'),
    sojafrei: t('profile.intoleranceSojafrei'),
    histaminarm: t('profile.intoleranceHistaminarm'),
  }
}

export function getIntoleranceDescriptions(t: TFunction): Record<(typeof INTOLERANCES)[number], string> {
  return {
    laktosefrei: t('profile.intoleranceLaktosefreiDesc'),
    glutenfrei: t('profile.intoleranceGlutenfreiDesc'),
    nussfrei: t('profile.intoleranceNussfreiDesc'),
    eifrei: t('profile.intoleranceEifreiDesc'),
    sojafrei: t('profile.intoleranceSojafreiDesc'),
    histaminarm: t('profile.intoleranceHistaminarmDesc'),
  }
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sitzend',
  'leicht_aktiv',
  'maessig_aktiv',
  'sehr_aktiv',
  'extrem_aktiv',
]

export function getActivityLevelLabels(t: TFunction): Record<ActivityLevel, string> {
  return {
    sitzend: t('profile.activitySitzend'),
    leicht_aktiv: t('profile.activityLeichtAktiv'),
    maessig_aktiv: t('profile.activityMaessigAktiv'),
    sehr_aktiv: t('profile.activitySehrAktiv'),
    extrem_aktiv: t('profile.activityExtremAktiv'),
  }
}

export const GOALS: Goal[] = ['abnehmen', 'halten', 'zunehmen', 'muskelaufbau']

export function getGoalLabels(t: TFunction): Record<Goal, string> {
  return {
    abnehmen: t('profile.goalAbnehmen'),
    halten: t('profile.goalHalten'),
    zunehmen: t('profile.goalZunehmen'),
    muskelaufbau: t('profile.goalMuskelaufbau'),
  }
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
