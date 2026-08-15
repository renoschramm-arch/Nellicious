import { Link } from 'react-router-dom'
import { DIET_TAG_LABELS, MEAL_TYPE_LABELS, useRecipes } from '../lib/useRecipes'
import type { NutritionType } from '../lib/useProfile'
import { PageFlatlay } from '../components/PageFlatlay'
import { RecipeFilterBar } from '../components/RecipeFilterBar'
import { useFavorites } from '../lib/useFavorites'
import { useRecipeFilters } from '../lib/useRecipeFilters'

export function RecipesPage() {
  const { recipes, loading } = useRecipes()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const filters = useRecipeFilters(recipes, favoriteIds)

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="recipes.jpg" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display font-bold text-2xl">Rezepte</h1>
          <Link
            to="/rezepte/neu"
            className="shrink-0 bg-primary text-on-primary font-semibold rounded-xl px-3 py-2 text-sm"
          >
            + Neu
          </Link>
        </div>
        <RecipeFilterBar filters={filters} />
      </div>

      {loading && <p className="text-text-muted text-sm">Lädt …</p>}
      {!loading && filters.filtered.length === 0 && (
        <p className="text-text-muted text-sm">Keine Rezepte gefunden.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {filters.filtered.map((recipe) => (
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
              aria-label={favoriteIds.has(recipe.id) ? 'Favorit entfernen' : 'Als Favorit markieren'}
              className={`absolute top-3 right-3 text-lg leading-none ${
                favoriteIds.has(recipe.id) ? 'text-danger' : 'text-text-muted hover:text-danger'
              }`}
            >
              {favoriteIds.has(recipe.id) ? '♥' : '♡'}
            </button>
            <div className="flex flex-wrap gap-1 pr-6">
              <span className="inline-block w-fit text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {MEAL_TYPE_LABELS[recipe.meal_type]}
              </span>
              {recipe.diet_tags
                .filter((tag): tag is NutritionType => tag === 'vegan' || tag === 'vegetarisch' || tag === 'keto' || tag === 'low_carb')
                .map((tag) => (
                  <span key={tag} className="inline-block w-fit text-xs font-medium text-basil bg-basil/10 rounded-full px-2 py-0.5">
                    {DIET_TAG_LABELS[tag]}
                  </span>
                ))}
            </div>
            <span className="font-display font-semibold text-lg pr-6">{recipe.title}</span>
            <span className="text-text-muted text-sm line-clamp-2">{recipe.description}</span>
            <span className="font-mono text-xs text-text-muted mt-1">{recipe.kcal} kcal</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
