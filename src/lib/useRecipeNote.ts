import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

export function useRecipeNote(recipeId: string | undefined) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    if (!user || !recipeId) return
    setLoading(true)
    const { data } = await supabase
      .from('recipe_notes')
      .select('note')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .maybeSingle()
    setNote(data?.note ?? '')
    setLoading(false)
  }, [user, recipeId])

  useEffect(() => {
    reload()
  }, [reload])

  async function saveNote(next: string) {
    if (!user || !recipeId) return
    setSaving(true)
    if (next.trim()) {
      await supabase
        .from('recipe_notes')
        .upsert({ user_id: user.id, recipe_id: recipeId, note: next }, { onConflict: 'user_id,recipe_id' })
    } else {
      await supabase.from('recipe_notes').delete().eq('user_id', user.id).eq('recipe_id', recipeId)
    }
    setNote(next)
    setSaving(false)
  }

  return { note, loading, saving, saveNote }
}
