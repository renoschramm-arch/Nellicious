import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DIET_TAG_LABELS, FREE_OF_LABELS, MEAL_TYPE_LABELS, useRecipe } from '../lib/useRecipes'
import { useMealLogs } from '../lib/useMealLogs'
import { useMealPlan } from '../lib/useMealPlan'
import { useFavorites } from '../lib/useFavorites'
import { useAuth } from '../lib/AuthContext'
import { toISODate } from '../lib/week'
import { RecipeForm } from '../components/RecipeForm'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, updateRecipe } = useRecipe(id)
  const { addLog } = useMealLogs()
  const todayISO = toISODate(new Date())
  const { setEntry } = useMealPlan(todayISO, todayISO)
  const { favoriteIds, toggleFavorite } = useFavorites()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [logging, setLogging] = useState(false)
  const [editing, setEditing] = useState(false)

  if (loading) return <p className="text-text-muted text-sm">Lädt …</p>
  if (!recipe) return <p className="text-text-muted text-sm">Rezept nicht gefunden.</p>

  const isOwner = !!user && recipe.owner_id === user.id

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
    // Loggen heißt: heute gegessen — also auch in den Wochenplan für heute
    // übernehmen, damit die Einkaufsliste die Zutaten mitzählt.
    await setEntry(todayISO, recipe.meal_type, recipe.id)
    setLogging(false)
    navigate('/rezepte')
  }

  if (editing) {
    return (
      <RecipeForm
        initial={recipe}
        onCancel={() => setEditing(false)}
        onSave={async (patch) => {
          await updateRecipe(patch)
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          to="/rezepte"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          ← Zurück zu Rezepten
        </Link>
        {isOwner && (
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
          >
            Bearbeiten
          </button>
        )}
        <button
          onClick={() => toggleFavorite(recipe.id)}
          aria-label={favoriteIds.has(recipe.id) ? 'Favorit entfernen' : 'Als Favorit markieren'}
          className={`shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm ${
            favoriteIds.has(recipe.id) ? 'text-danger' : 'text-text-muted hover:text-danger'
          }`}
        >
          {favoriteIds.has(recipe.id) ? '♥' : '♡'}
        </button>
      </div>

      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
            {MEAL_TYPE_LABELS[recipe.meal_type]}
          </span>
          {recipe.diet_tags
            .filter((tag) => tag !== 'omnivore')
            .map((tag) => (
              <span key={tag} className="inline-block text-xs font-medium text-basil bg-basil/10 rounded-full px-2.5 py-1">
                {DIET_TAG_LABELS[tag as keyof typeof DIET_TAG_LABELS]}
              </span>
            ))}
          {recipe.free_of.map((value) => (
            <span key={value} className="inline-block text-xs font-medium text-honey bg-honey/10 rounded-full px-2.5 py-1">
              {FREE_OF_LABELS[value as keyof typeof FREE_OF_LABELS]}
            </span>
          ))}
        </div>
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
