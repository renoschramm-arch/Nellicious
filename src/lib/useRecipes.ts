import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Database } from './database.types'

export type Recipe = Database['public']['Tables']['recipes']['Row']

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

  return { recipe, loading }
}
