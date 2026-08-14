import { useState, type FormEvent } from 'react'
import {
  DIET_TAGS,
  DIET_TAG_LABELS,
  DIET_TAG_DESCRIPTIONS,
  FREE_OF_OPTIONS,
  FREE_OF_LABELS,
  FREE_OF_DESCRIPTIONS,
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  type MealType,
  type Recipe,
} from '../lib/useRecipes'
import { TagLegend } from './TagLegend'

export interface RecipeFormValues {
  title: string
  description: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  ingredients: string[]
  instructions: string
  meal_type: MealType
  diet_tags: string[]
  free_of: string[]
}

export function RecipeForm({
  initial,
  onCancel,
  onSave,
  submitLabel = 'Speichern',
  savedLabel = 'Gespeichert ✓',
}: {
  initial?: Recipe
  onCancel: () => void
  onSave: (values: RecipeFormValues) => Promise<void>
  submitLabel?: string
  savedLabel?: string
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [kcal, setKcal] = useState(initial ? String(initial.kcal) : '')
  const [protein, setProtein] = useState(initial ? String(initial.protein_g) : '')
  const [carbs, setCarbs] = useState(initial ? String(initial.carbs_g) : '')
  const [fat, setFat] = useState(initial ? String(initial.fat_g) : '')
  const [ingredients, setIngredients] = useState(initial?.ingredients.join('\n') ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')
  const [mealType, setMealType] = useState<MealType>(initial?.meal_type ?? 'mittag')
  const [dietTags, setDietTags] = useState<string[]>(initial?.diet_tags ?? [])
  const [freeOf, setFreeOf] = useState<string[]>(initial?.free_of ?? [])
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  function toggleDietTag(value: string) {
    setDietTags((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function toggleFreeOf(value: string) {
    setFreeOf((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

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
      diet_tags: dietTags,
      free_of: freeOf,
    })
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Geeignet für</span>
        <div className="flex flex-wrap gap-1.5">
          {DIET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleDietTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                dietTags.includes(tag)
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-2 border border-border text-text-muted hover:text-text'
              }`}
            >
              {DIET_TAG_LABELS[tag]}
            </button>
          ))}
        </div>
        <TagLegend
          items={DIET_TAGS.map((tag) => ({ label: DIET_TAG_LABELS[tag], description: DIET_TAG_DESCRIPTIONS[tag] }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Frei von</span>
        <div className="flex flex-wrap gap-1.5">
          {FREE_OF_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleFreeOf(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                freeOf.includes(value)
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-2 border border-border text-text-muted hover:text-text'
              }`}
            >
              {FREE_OF_LABELS[value]}
            </button>
          ))}
        </div>
        <TagLegend
          items={FREE_OF_OPTIONS.map((value) => ({ label: FREE_OF_LABELS[value], description: FREE_OF_DESCRIPTIONS[value] }))}
        />
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
          {saving ? 'Wird gespeichert …' : justSaved ? savedLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
