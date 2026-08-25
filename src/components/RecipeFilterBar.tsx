import { useTranslation } from 'react-i18next'
import {
  DIET_TAGS,
  getDietTagLabels,
  getDietTagDescriptions,
  FREE_OF_OPTIONS,
  getFreeOfLabels,
  getFreeOfDescriptions,
  getMealTypeLabels,
  MEAL_TYPES,
} from '../lib/useRecipes'
import type { RecipeFiltersState } from '../lib/useRecipeFilters'
import { TagLegend } from './TagLegend'

export function RecipeFilterBar({ filters }: { filters: RecipeFiltersState }) {
  const { t } = useTranslation()
  const {
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
    activeFilterCount,
  } = filters

  // Kürzeres Label nur für die Filter-Pills hier, damit alle Buttons in einer
  // Zeile passen — Badges auf Karten/Detailseite behalten das volle Label.
  const filterLabels = { ...getMealTypeLabels(t), fruehstueck: t('mealTypes.fruehstueckShort') }
  const dietTagLabels = getDietTagLabels(t)
  const dietTagDescriptions = getDietTagDescriptions(t)
  const freeOfLabels = getFreeOfLabels(t)
  const freeOfDescriptions = getFreeOfDescriptions(t)

  return (
    <div className="flex flex-col gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('recipeFilterBar.searchPlaceholder')}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
      />
      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
        <button
          onClick={() => setMealType('alle')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mealType === 'alle' ? 'bg-primary text-on-primary' : 'bg-surface border border-border text-text-muted hover:text-text'
          }`}
        >
          {t('recipeFilterBar.all')}
        </button>
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mealType === type ? 'bg-primary text-on-primary' : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}
          >
            {filterLabels[type]}
          </button>
        ))}
        <button
          onClick={() => setOnlyFavorites((v) => !v)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            onlyFavorites ? 'bg-primary text-on-primary' : 'bg-surface border border-border text-text-muted hover:text-text'
          }`}
        >
          {t('recipeFilterBar.favorites')}
        </button>
      </div>

      <details className="bg-surface border border-border rounded-2xl p-4 group">
        <summary className="flex items-center justify-between gap-2 cursor-pointer text-sm font-semibold list-none">
          <span>
            {t('recipeFilterBar.filters')}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </span>
          <span className="text-text-muted transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-muted">{t('recipeFilterBar.nutritionType')}</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDietFilter('alle')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  dietFilter === 'alle' ? 'bg-primary text-on-primary' : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                }`}
              >
                {t('recipeFilterBar.all')}
              </button>
              {DIET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setDietFilter(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    dietFilter === tag ? 'bg-primary text-on-primary' : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                  }`}
                >
                  {dietTagLabels[tag]}
                </button>
              ))}
            </div>
            <TagLegend
              items={DIET_TAGS.map((tag) => ({ label: dietTagLabels[tag], description: dietTagDescriptions[tag] }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-muted">{t('recipeFilterBar.freeOf')}</span>
            <div className="flex flex-wrap gap-1.5">
              {FREE_OF_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => toggleFreeOfFilter(value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    freeOfFilter.includes(value) ? 'bg-primary text-on-primary' : 'bg-surface-2 border border-border text-text-muted hover:text-text'
                  }`}
                >
                  {freeOfLabels[value]}
                </button>
              ))}
            </div>
            <TagLegend
              items={FREE_OF_OPTIONS.map((value) => ({ label: freeOfLabels[value], description: freeOfDescriptions[value] }))}
            />
          </div>
        </div>
      </details>
    </div>
  )
}
