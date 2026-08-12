import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MEAL_TYPE_LABELS, MEAL_TYPES, useRecipes, type MealType } from '../lib/useRecipes'
import { PageFlatlay } from '../components/PageFlatlay'

// Kürzeres Label nur für die Filter-Pills hier, damit alle 5 Buttons in einer
// Zeile passen — Badges auf Karten/Detailseite behalten "Frühstück".
const FILTER_LABELS: Record<MealType, string> = {
  ...MEAL_TYPE_LABELS,
  fruehstueck: 'Früh',
}

export function RecipesPage() {
  const { recipes, loading } = useRecipes()
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState<MealType | 'alle'>('alle')

  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) &&
      (mealType === 'alle' || r.meal_type === mealType),
  )

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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rezepte durchsuchen …"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        />
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
          <button
            onClick={() => setMealType('alle')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mealType === 'alle' ? 'bg-primary text-on-primary' : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}
          >
            Alle
          </button>
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                mealType === type ? 'bg-primary text-on-primary' : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
            >
              {FILTER_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-text-muted text-sm">Lädt …</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-text-muted text-sm">Keine Rezepte gefunden.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((recipe) => (
          <Link
            key={recipe.id}
            to={`/rezepte/${recipe.id}`}
            className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-primary transition-colors"
          >
            <span className="inline-block w-fit text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
              {MEAL_TYPE_LABELS[recipe.meal_type]}
            </span>
            <span className="font-display font-semibold text-lg">{recipe.title}</span>
            <span className="text-text-muted text-sm line-clamp-2">{recipe.description}</span>
            <span className="font-mono text-xs text-text-muted mt-1">{recipe.kcal} kcal</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
