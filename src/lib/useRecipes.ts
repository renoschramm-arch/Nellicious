import { useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import {
  NUTRITION_TYPES,
  getNutritionTypeLabels,
  getNutritionTypeDescriptions,
  INTOLERANCES,
  getIntoleranceLabels,
  getIntoleranceDescriptions,
} from './useProfile'
import type { Database } from './database.types'

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']
export type MealType = Recipe['meal_type']

export const MEAL_TYPES: MealType[] = ['fruehstueck', 'mittag', 'abend', 'snack']

export function getMealTypeLabels(t: TFunction): Record<MealType, string> {
  return {
    fruehstueck: t('mealTypes.fruehstueck'),
    mittag: t('mealTypes.mittag'),
    abend: t('mealTypes.abend'),
    snack: t('mealTypes.snack'),
  }
}

// Rezepte werden mit denselben Ernährungstyp-/Unverträglichkeits-Werten
// gekennzeichnet, die auch im Profil verwendet werden.
export const DIET_TAGS = NUTRITION_TYPES
export const getDietTagLabels = getNutritionTypeLabels
export const getDietTagDescriptions = getNutritionTypeDescriptions
export const FREE_OF_OPTIONS = INTOLERANCES
export const getFreeOfLabels = getIntoleranceLabels
export const getFreeOfDescriptions = getIntoleranceDescriptions

export function useRecipes() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('recipes')
      .select('*')
      .order('title', { ascending: true })
      .then(({ data }) => {
        setRecipes(data ?? [])
        setLoading(false)
      })
  }, [])

  async function createRecipe(values: Omit<RecipeInsert, 'owner_id'>) {
    if (!user) return null
    const { data } = await supabase
      .from('recipes')
      .insert({ ...values, owner_id: user.id })
      .select('*')
      .single()
    if (data) {
      setRecipes((prev) => [...prev, data].sort((a, b) => a.title.localeCompare(b.title)))
    }
    return data ?? null
  }

  return { recipes, loading, createRecipe }
}

export function useRecipe(id: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setRecipe(data ?? null)
        setLoading(false)
      })
  }, [id])

  async function updateRecipe(patch: RecipeUpdate) {
    if (!id) return
    const { data } = await supabase.from('recipes').update(patch).eq('id', id).select('*').single()
    if (data) setRecipe(data)
  }

  async function deleteRecipe() {
    if (!id) return
    await supabase.from('recipes').delete().eq('id', id)
  }

  async function setShared(shared: boolean) {
    if (!id) return
    const { error } = await supabase.rpc('set_recipe_shared', { p_recipe_id: id, p_shared: shared })
    if (!error) setRecipe((prev) => (prev ? { ...prev, is_shared: shared } : prev))
    return { error: error?.message ?? null }
  }

  return { recipe, loading, updateRecipe, deleteRecipe, setShared }
}
