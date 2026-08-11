import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRecipe } from '../lib/useRecipes'
import { useMealLogs } from '../lib/useMealLogs'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading } = useRecipe(id)
  const { addLog } = useMealLogs()
  const navigate = useNavigate()
  const [logging, setLogging] = useState(false)

  if (loading) return <p className="text-text-muted text-sm">Lädt …</p>
  if (!recipe) return <p className="text-text-muted text-sm">Rezept nicht gefunden.</p>

  async function handleLog() {
    if (!recipe) return
    setLogging(true)
    await addLog({
      name: recipe.title,
      kcal: recipe.kcal,
      protein_g: recipe.protein_g,
      carbs_g: recipe.carbs_g,
      fat_g: recipe.fat_g,
      recipe_id: recipe.id,
    })
    setLogging(false)
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/rezepte" className="text-sm text-text-muted hover:text-text w-fit">
        ← Zurück zu Rezepten
      </Link>

      <div>
        <h1 className="font-display font-bold text-2xl">{recipe.title}</h1>
        <p className="text-text-muted mt-1">{recipe.description}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 font-mono text-sm">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">kcal</div>
          {recipe.kcal}
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">Protein</div>
          {recipe.protein_g}g
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">Kohlenh.</div>
          {recipe.carbs_g}g
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">Fett</div>
          {recipe.fat_g}g
        </div>
      </div>

      {recipe.ingredients.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg mb-2">Zutaten</h2>
          <ul className="flex flex-col gap-1.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions && (
        <div>
          <h2 className="font-display font-semibold text-lg mb-2">Zubereitung</h2>
          <p className="text-sm whitespace-pre-line">{recipe.instructions}</p>
        </div>
      )}

      <button
        onClick={handleLog}
        disabled={logging}
        className="bg-primary text-on-primary font-semibold rounded-xl py-3 disabled:opacity-60"
      >
        {logging ? 'Wird gespeichert …' : 'Als heutige Mahlzeit loggen'}
      </button>
    </div>
  )
}
