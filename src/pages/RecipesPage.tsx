import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../lib/useRecipes'
import { PageFlatlay } from '../components/PageFlatlay'

export function RecipesPage() {
  const { recipes, loading } = useRecipes()
  const [query, setQuery] = useState('')

  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="recipes.jpg" />
      <div>
        <h1 className="font-display font-bold text-2xl mb-3">Rezepte</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rezepte durchsuchen …"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        />
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
            <span className="font-display font-semibold text-lg">{recipe.title}</span>
            <span className="text-text-muted text-sm line-clamp-2">{recipe.description}</span>
            <span className="font-mono text-xs text-text-muted mt-1">{recipe.kcal} kcal</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
