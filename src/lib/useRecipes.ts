import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Database } from './database.types'

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']
export type MealType = Recipe['meal_type']

export const MEAL_TYPES: MealType[] = ['fruehstueck', 'mittag', 'abend', 'snack']

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  fruehstueck: 'Frühstück',
  mittag: 'Mittag',
  abend: 'Abend',
  snack: 'Snack',
}

export function useRecipes() {
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

  return { recipes, loading }
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
