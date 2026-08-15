import { useState } from 'react'
import type { NutritionType } from './useProfile'
import type { MealType, Recipe } from './useRecipes'

export function useRecipeFilters(
  recipes: Recipe[],
  favoriteIds: Set<string>,
  initialMealType: MealType | 'alle' = 'alle',
) {
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState<MealType | 'alle'>(initialMealType)
  const [dietFilter, setDietFilter] = useState<NutritionType | 'alle'>('alle')
  const [freeOfFilter, setFreeOfFilter] = useState<string[]>([])
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  function toggleFreeOfFilter(value: string) {
    setFreeOfFilter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) &&
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
