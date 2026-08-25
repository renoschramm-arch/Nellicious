import { useTranslation } from 'react-i18next'
import { getDietTagLabels, getMealTypeLabels, localizeRecipeText, useRecipes, type MealType, type Recipe } from '../lib/useRecipes'
import { useFavorites } from '../lib/useFavorites'
import { useRecipeFilters } from '../lib/useRecipeFilters'
import { RecipeFilterBar } from './RecipeFilterBar'

export function RecipePickerModal({
  defaultMealType = 'alle',
  onSelect,
  onClose,
}: {
  defaultMealType?: MealType | 'alle'
  onSelect: (recipe: Recipe) => void
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const { recipes, loading } = useRecipes()
  const { favoriteIds } = useFavorites()
  const filters = useRecipeFilters(recipes, favoriteIds, defaultMealType)
  const mealTypeLabels = getMealTypeLabels(t)
  const dietTagLabels = getDietTagLabels(t)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-display font-semibold text-lg">{t('recipePicker.title')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-sm" aria-label={t('recipePicker.close')}>
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          <RecipeFilterBar filters={filters} />
          {loading && <p className="text-text-muted text-sm">{t('recipePicker.loading')}</p>}
          {!loading && filters.filtered.length === 0 && (
            <p className="text-text-muted text-sm">{t('recipePicker.noneFound')}</p>
          )}
          <div className="flex flex-col gap-2">
            {filters.filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelect(recipe)}
                className="text-left bg-surface border border-border rounded-xl p-3 flex items-center gap-3 hover:border-primary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {mealTypeLabels[recipe.meal_type]}
                    </span>
                    {recipe.diet_tags
                      .filter((tag) => tag === 'vegan' || tag === 'vegetarisch' || tag === 'keto' || tag === 'low_carb')
                      .map((tag) => (
                        <span key={tag} className="inline-block text-xs font-medium text-basil bg-basil/10 rounded-full px-2 py-0.5">
                          {dietTagLabels[tag as keyof typeof dietTagLabels]}
                        </span>
                      ))}
                    {favoriteIds.has(recipe.id) && <span className="text-danger text-xs">♥</span>}
                  </div>
                  <div className="font-medium truncate">{localizeRecipeText(recipe, i18n.language).title}</div>
                </div>
                <span className="font-mono text-xs text-text-muted shrink-0">{recipe.kcal} kcal</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
