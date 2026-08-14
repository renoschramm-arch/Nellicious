import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type { RecipeFormValues } from '../components/RecipeForm'

export type ImportedRecipe = Omit<RecipeFormValues, 'diet_tags' | 'free_of'>

const DEFAULT_ERROR = 'Import fehlgeschlagen. Bitte Link prüfen oder Rezept manuell anlegen.'

export async function importRecipeFromUrl(url: string): Promise<ImportedRecipe> {
  const { data, error } = await supabase.functions.invoke('import-recipe', {
    body: { url },
  })

  if (error) {
    let message: string | null = null
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json()
        if (typeof body?.error === 'string') message = body.error
      } catch {
        // Antwort war kein JSON – Standardmeldung verwenden.
      }
    }
    throw new Error(message ?? DEFAULT_ERROR)
  }

  return data as ImportedRecipe
}
