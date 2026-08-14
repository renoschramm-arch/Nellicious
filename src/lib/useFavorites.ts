import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

export function useFavorites() {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('recipe_favorites').select('recipe_id').eq('user_id', user.id)
    setFavoriteIds(new Set((data ?? []).map((row) => row.recipe_id)))
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  async function toggleFavorite(recipeId: string) {
    if (!user) return
    const isFavorite = favoriteIds.has(recipeId)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (isFavorite) next.delete(recipeId)
      else next.add(recipeId)
      return next
    })
    if (isFavorite) {
      await supabase.from('recipe_favorites').delete().eq('user_id', user.id).eq('recipe_id', recipeId)
    } else {
      await supabase.from('recipe_favorites').insert({ user_id: user.id, recipe_id: recipeId })
    }
  }

  return { favoriteIds, loading, toggleFavorite }
}
