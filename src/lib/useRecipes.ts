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
import type { RecipeFormValues } from '../components/RecipeForm'

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

export interface LocalizedRecipeText {
  title: string
  description: string
  ingredients: string[]
  instructions: string
}

// Rezeptinhalte (Titel, Beschreibung, Zutaten, Zubereitung) sind freier Text
// und werden separat per *_en-Spalte übersetzt — im Unterschied zu
// Mahlzeitenart/Ernährungstyp/Unverträglichkeiten, die über feste,
// automatisch übersetzte Labels laufen. Fehlt eine englische Übersetzung
// (noch) nicht, wird auf den deutschen Text zurückgefallen, damit nie ein
// leeres Feld angezeigt wird.
export function localizeRecipeText(recipe: Recipe, language: string): LocalizedRecipeText {
  if (language !== 'en') {
    return {
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
    }
  }
  return {
    title: recipe.title_en?.trim() ? recipe.title_en : recipe.title,
    description: recipe.description_en?.trim() ? recipe.description_en : recipe.description,
    ingredients: recipe.ingredients_en && recipe.ingredients_en.length > 0 ? recipe.ingredients_en : recipe.ingredients,
    instructions: recipe.instructions_en?.trim() ? recipe.instructions_en : recipe.instructions,
  }
}

// Wer ein nicht selbst angelegtes Rezept bearbeitet (globales Beispielrezept
// oder ein von anderen geteiltes), bekommt statt eines Updates am Original
// eine private Kopie (forked_from = Original-ID) — alle anderen sehen
// weiterhin unverändert das Original. Für Listen wird die Kopie deshalb an
// der Stelle des Originals eingeblendet, das Original selbst ausgeblendet.
function mergeForks(recipes: Recipe[]): Recipe[] {
  const forkByOriginal = new Map<string, Recipe>()
  for (const r of recipes) {
    if (r.forked_from) forkByOriginal.set(r.forked_from, r)
  }
  return recipes
    .filter((r) => !r.forked_from)
    .map((r) => forkByOriginal.get(r.id) ?? r)
    .sort((a, b) => a.title.localeCompare(b.title))
}

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
        setRecipes(mergeForks(data ?? []))
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
  const { user } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data } = await supabase.from('recipes').select('*').eq('id', id!).maybeSingle()
      if (cancelled) return

      // Fremdes/globales Rezept, aber eine eigene bearbeitete Kopie davon
      // existiert bereits — dann die Kopie zeigen statt des Originals (siehe
      // mergeForks-Kommentar oben), damit Bearbeiten/Löschen etc. konsistent
      // auf der eigenen Kopie weiterlaufen.
      if (data && user && data.owner_id !== user.id && !data.forked_from) {
        const { data: fork } = await supabase
          .from('recipes')
          .select('*')
          .eq('forked_from', id!)
          .eq('owner_id', user.id)
          .maybeSingle()
        if (!cancelled) {
          setRecipe(fork ?? data)
          setLoading(false)
        }
        return
      }

      setRecipe(data ?? null)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, user])

  async function updateRecipe(patch: RecipeUpdate) {
    if (!recipe) return
    const { data } = await supabase.from('recipes').update(patch).eq('id', recipe.id).select('*').single()
    if (data) setRecipe(data)
  }

  // Bearbeitet jemand ein nicht selbst angelegtes Rezept, entsteht keine
  // Änderung am Original, sondern eine private Kopie mit forked_from =
  // Original-ID — alle anderen sehen weiterhin unverändert das Original.
  // Ein Konflikt (schon vorhandene eigene Kopie desselben Originals) wird
  // per Upsert einfach aktualisiert statt eine zweite Kopie anzulegen.
  async function forkRecipe(values: RecipeFormValues) {
    if (!recipe || !user) return null
    const { data } = await supabase
      .from('recipes')
      .upsert(
        {
          ...values,
          owner_id: user.id,
          forked_from: recipe.forked_from ?? recipe.id,
          is_shared: false,
        },
        { onConflict: 'owner_id,forked_from' },
      )
      .select('*')
      .single()
    if (data) setRecipe(data)
    return data ?? null
  }

  async function deleteRecipe() {
    if (!recipe) return
    await supabase.from('recipes').delete().eq('id', recipe.id)
  }

  async function setShared(shared: boolean) {
    if (!recipe) return
    const { error } = await supabase.rpc('set_recipe_shared', { p_recipe_id: recipe.id, p_shared: shared })
    if (!error) setRecipe((prev) => (prev ? { ...prev, is_shared: shared } : prev))
    return { error: error?.message ?? null }
  }

  return { recipe, loading, updateRecipe, forkRecipe, deleteRecipe, setShared }
}
