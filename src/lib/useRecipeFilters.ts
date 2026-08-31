import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NutritionType } from './useProfile'
import { localizeRecipeText, type MealType, type Recipe } from './useRecipes'

// Viele Fischrezepte heißen nach der jeweiligen Fischart (Zander, Barsch,
// Kabeljau, ...) und enthalten das Wort "Fisch"/"fish" nirgends im Text.
// Der diet_tags-Wert "pescetarisch" taugt dafür nicht als Ersatz, da er auch
// auf rein vegetarische/vegane Rezepte gesetzt wird (die isst ein Pescetarier
// schließlich auch) — daher stattdessen eine feste Liste an Fischarten.
const FISH_SPECIES_DE = [
  'lachs', 'thunfisch', 'kabeljau', 'forelle', 'hering', 'matjes', 'scholle',
  'sardine', 'sardelle', 'makrele', 'zander', 'barsch', 'seelachs', 'rotbarsch',
  'aal', 'wolfsbarsch', 'steinbeißer', 'pangasius',
]
const FISH_SPECIES_EN = [
  'salmon', 'tuna', 'cod', 'trout', 'herring', 'plaice', 'sardine', 'anchov',
  'mackerel', 'zander', 'pike-perch', 'perch', 'pollock', 'redfish', 'eel',
  'sea bass', 'wolffish', 'catfish', 'pangasius',
]

export function useRecipeFilters(
  recipes: Recipe[],
  favoriteIds: Set<string>,
  initialMealType: MealType | 'alle' = 'alle',
) {
  const { i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState<MealType | 'alle'>(initialMealType)
  const [dietFilter, setDietFilter] = useState<NutritionType | 'alle'>('alle')
  const [freeOfFilter, setFreeOfFilter] = useState<string[]>([])
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  function toggleFreeOfFilter(value: string) {
    setFreeOfFilter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const trimmedQuery = query.trim().toLowerCase()

  function matchesQuery(r: Recipe): boolean {
    if (!trimmedQuery) return true
    const { title, description, ingredients } = localizeRecipeText(r, i18n.language)
    const haystack = `${title} ${description} ${ingredients.join(' ')}`.toLowerCase()

    const fishWord = i18n.language === 'en' ? 'fish' : 'fisch'
    if (fishWord.startsWith(trimmedQuery) || trimmedQuery.startsWith(fishWord)) {
      const species = i18n.language === 'en' ? FISH_SPECIES_EN : FISH_SPECIES_DE
      if (species.some((s) => haystack.includes(s))) return true
    }

    return haystack.includes(trimmedQuery)
  }

  const filtered = recipes.filter(
    (r) =>
      matchesQuery(r) &&
      (mealType === 'alle' || r.meal_type === mealType) &&
      (dietFilter === 'alle' || r.diet_tags.includes(dietFilter)) &&
      freeOfFilter.every((f) => r.free_of.includes(f)) &&
      (!onlyFavorites || favoriteIds.has(r.id)),
  )
  const activeFilterCount = (dietFilter !== 'alle' ? 1 : 0) + freeOfFilter.length

  return {
    query,
    setQuery,
    mealType,
    setMealType,
    dietFilter,
    setDietFilter,
    freeOfFilter,
    toggleFreeOfFilter,
    onlyFavorites,
    setOnlyFavorites,
    filtered,
    activeFilterCount,
  }
}

export type RecipeFiltersState = ReturnType<typeof useRecipeFilters>
