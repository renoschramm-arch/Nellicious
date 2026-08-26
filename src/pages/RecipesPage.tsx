import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDietTagLabels, getMealTypeLabels, localizeRecipeText, useRecipes } from '../lib/useRecipes'
import type { NutritionType } from '../lib/useProfile'
import { PageFlatlay } from '../components/PageFlatlay'
import { RecipeFilterBar } from '../components/RecipeFilterBar'
import { WhatCanICookModal } from '../components/WhatCanICookModal'
import { useFavorites } from '../lib/useFavorites'
import { useRecipeFilters } from '../lib/useRecipeFilters'

const WHAT_CAN_I_COOK_OPEN_KEY = 'whatCanICook.open'

export function RecipesPage() {
  const { t, i18n } = useTranslation()
  const { recipes, loading } = useRecipes()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const filters = useRecipeFilters(recipes, favoriteIds)
  const mealTypeLabels = getMealTypeLabels(t)
  const dietTagLabels = getDietTagLabels(t)
  // Bleibt über den Besuch eines vorgeschlagenen Rezepts hinweg offen (Zurück-
  // Navigation entfernt die Seite und baut sie neu auf) statt sich zu schließen.
  const [showWhatCanICook, setShowWhatCanICook] = useState(() => sessionStorage.getItem(WHAT_CAN_I_COOK_OPEN_KEY) === '1')

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="recipes.jpg" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display font-bold text-2xl">{t('recipes.title')}</h1>
          <Link
            to="/rezepte/neu"
            className="shrink-0 bg-primary text-on-primary font-semibold rounded-xl px-3 py-2 text-sm"
          >
            {t('recipes.new')}
          </Link>
        </div>
        <RecipeFilterBar filters={filters} />
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(WHAT_CAN_I_COOK_OPEN_KEY, '1')
            setShowWhatCanICook(true)
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/90 backdrop-blur-sm py-2.5 text-sm font-medium text-text hover:border-primary transition-colors"
        >
          {t('recipes.whatCanICookButton')}
        </button>
      </div>

      {showWhatCanICook && (
        <WhatCanICookModal
          recipes={recipes}
          onClose={() => {
            sessionStorage.removeItem(WHAT_CAN_I_COOK_OPEN_KEY)
            setShowWhatCanICook(false)
          }}
        />
      )}

      {loading && <p className="text-text-muted text-sm">{t('recipes.loading')}</p>}
      {!loading && filters.filtered.length === 0 && (
        <p className="text-text-muted text-sm">{t('recipes.noneFound')}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {filters.filtered.map((recipe) => {
          const localized = localizeRecipeText(recipe, i18n.language)
          return (
          <Link
            key={recipe.id}
            to={`/rezepte/${recipe.id}`}
            className="relative bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-primary transition-colors"
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite(recipe.id)
              }}
              aria-label={favoriteIds.has(recipe.id) ? t('recipes.removeFavorite') : t('recipes.addFavorite')}
              className={`absolute top-3 right-3 text-lg leading-none ${
                favoriteIds.has(recipe.id) ? 'text-danger' : 'text-text-muted hover:text-danger'
              }`}
            >
              {favoriteIds.has(recipe.id) ? '♥' : '♡'}
            </button>
            <div className="flex flex-wrap gap-1 pr-6">
              <span className="inline-block w-fit text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {mealTypeLabels[recipe.meal_type]}
              </span>
              {recipe.diet_tags
                .filter((tag): tag is NutritionType => tag === 'vegan' || tag === 'vegetarisch' || tag === 'keto' || tag === 'low_carb')
                .map((tag) => (
                  <span key={tag} className="inline-block w-fit text-xs font-medium text-basil bg-basil/10 rounded-full px-2 py-0.5">
                    {dietTagLabels[tag]}
                  </span>
                ))}
            </div>
            <span className="font-display font-semibold text-lg pr-6">{localized.title}</span>
            <span className="text-text-muted text-sm line-clamp-2">{localized.description}</span>
            <span className="font-mono text-xs text-text-muted mt-1">{recipe.kcal} kcal</span>
          </Link>
          )
        })}
      </div>
    </div>
  )
}
