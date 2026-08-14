import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'
import {
  NUTRITION_TYPES,
  NUTRITION_TYPE_LABELS,
  NUTRITION_TYPE_DESCRIPTIONS,
  INTOLERANCES,
  INTOLERANCE_LABELS,
  INTOLERANCE_DESCRIPTIONS,
} from './useProfile'
import type { Database } from './database.types'

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']
export type MealType = Recipe['meal_type']

export const MEAL_TYPES: MealType[] = ['fruehstueck', 'mittag', 'abend', 'snack']

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  fruehstueck: 'Frühstück',
  mittag: 'Mittag',
  abend: 'Abend',
  snack: 'Snack',
}

// Rezepte werden mit denselben Ernährungstyp-/Unverträglichkeits-Werten
// gekennzeichnet, die auch im Profil verwendet werden.
export const DIET_TAGS = NUTRITION_TYPES
export const DIET_TAG_LABELS = NUTRITION_TYPE_LABELS
export const DIET_TAG_DESCRIPTIONS = NUTRITION_TYPE_DESCRIPTIONS
export const FREE_OF_OPTIONS = INTOLERANCES
export const FREE_OF_LABELS = INTOLERANCE_LABELS
export const FREE_OF_DESCRIPTIONS = INTOLERANCE_DESCRIPTIONS

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

  return { recipe, loading, updateRecipe }
}
