import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MEAL_TYPE_LABELS, MEAL_TYPES, useRecipe, type MealType, type Recipe } from '../lib/useRecipes'
import { useMealLogs } from '../lib/useMealLogs'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, updateRecipe } = useRecipe(id)
  const { addLog } = useMealLogs()
  const navigate = useNavigate()
  const [logging, setLogging] = useState(false)
  const [editing, setEditing] = useState(false)

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

  if (editing) {
    return (
      <EditRecipeForm
        recipe={recipe}
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
      <Link to="/rezepte" className="text-sm text-text-muted hover:text-text w-fit">
        ← Zurück zu Rezepten
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1 mb-2">
            {MEAL_TYPE_LABELS[recipe.meal_type]}
          </span>
          <h1 className="font-display font-bold text-2xl">{recipe.title}</h1>
          <p className="text-text-muted mt-1">{recipe.description}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          Bearbeiten
        </button>
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

function EditRecipeForm({
  recipe,
  onCancel,
  onSave,
}: {
  recipe: Recipe
  onCancel: () => void
  onSave: (patch: {
    title: string
    description: string
    kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
    ingredients: string[]
    instructions: string
    meal_type: MealType
  }) => Promise<void>
}) {
  const [title, setTitle] = useState(recipe.title)
  const [description, setDescription] = useState(recipe.description)
  const [kcal, setKcal] = useState(String(recipe.kcal))
  const [protein, setProtein] = useState(String(recipe.protein_g))
  const [carbs, setCarbs] = useState(String(recipe.carbs_g))
  const [fat, setFat] = useState(String(recipe.fat_g))
  const [ingredients, setIngredients] = useState(recipe.ingredients.join('\n'))
  const [instructions, setInstructions] = useState(recipe.instructions)
  const [mealType, setMealType] = useState<MealType>(recipe.meal_type)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      title,
      description,
      kcal: Number(kcal) || 0,
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
      ingredients: ingredients
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      instructions,
      meal_type: mealType,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <button type="button" onClick={onCancel} className="text-sm text-text-muted hover:text-text w-fit">
        ← Abbrechen
      </button>

      <label className="flex flex-col gap-1.5 text-sm">
        Titel
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Beschreibung
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary resize-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Mahlzeitenart
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        >
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {MEAL_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-4 gap-2">
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          kcal
          <input
            required
            type="number"
            min={0}
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Protein g
          <input
            type="number"
            min={0}
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Kohlenh. g
          <input
            type="number"
            min={0}
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Fett g
          <input
            type="number"
            min={0}
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Zutaten (eine pro Zeile)
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={6}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary font-mono text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Zubereitung
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl py-2.5 text-sm text-text-muted border border-border"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? 'Wird gespeichert …' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
