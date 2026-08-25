import { lazy, Suspense, useState, type FormEvent } from 'react'
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
  type MealType,
  type Recipe,
} from '../lib/useRecipes'
import { useFoodSearch, type FoodSearchResult } from '../lib/useFoodSearch'
import { lookupFoodByBarcode } from '../lib/lookupFoodByBarcode'
import { TagLegend } from './TagLegend'

const BarcodeScannerModal = lazy(() =>
  import('./BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal })),
)

export interface RecipeFormValues {
  title: string
  description: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  ingredients: string[]
  instructions: string
  title_en: string | null
  description_en: string | null
  ingredients_en: string[] | null
  instructions_en: string | null
  meal_type: MealType
  diet_tags: string[]
  free_of: string[]
  servings: number
}

export function RecipeForm({
  initial,
  onCancel,
  onSave,
  submitLabel,
  savedLabel,
}: {
  initial?: Recipe
  onCancel: () => void
  onSave: (values: RecipeFormValues) => Promise<void>
  submitLabel?: string
  savedLabel?: string
}) {
  const { t } = useTranslation()
  const finalSubmitLabel = submitLabel ?? t('recipeForm.save')
  const finalSavedLabel = savedLabel ?? t('recipeForm.saved')
  const mealTypeLabels = getMealTypeLabels(t)
  const dietTagLabels = getDietTagLabels(t)
  const dietTagDescriptions = getDietTagDescriptions(t)
  const freeOfLabels = getFreeOfLabels(t)
  const freeOfDescriptions = getFreeOfDescriptions(t)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [kcal, setKcal] = useState(initial ? String(initial.kcal) : '')
  const [protein, setProtein] = useState(initial ? String(initial.protein_g) : '')
  const [carbs, setCarbs] = useState(initial ? String(initial.carbs_g) : '')
  const [fat, setFat] = useState(initial ? String(initial.fat_g) : '')
  const [servings, setServings] = useState(initial ? String(initial.servings) : '1')
  const [ingredients, setIngredients] = useState(initial?.ingredients.join('\n') ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? '')
  const [descriptionEn, setDescriptionEn] = useState(initial?.description_en ?? '')
  const [ingredientsEn, setIngredientsEn] = useState(initial?.ingredients_en?.join('\n') ?? '')
  const [instructionsEn, setInstructionsEn] = useState(initial?.instructions_en ?? '')
  const [mealType, setMealType] = useState<MealType>(initial?.meal_type ?? 'mittag')
  const [dietTags, setDietTags] = useState<string[]>(initial?.diet_tags ?? [])
  const [freeOf, setFreeOf] = useState<string[]>(initial?.free_of ?? [])
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const [foodQuery, setFoodQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [ingredientGrams, setIngredientGrams] = useState('100')
  const { results: foodResults, loading: foodLoading, error: foodError } = useFoodSearch(foodQuery)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  function selectIngredientFood(food: FoodSearchResult) {
    setSelectedFood(food)
    setFoodQuery(food.name)
  }

  async function handleBarcodeDetected(barcode: string) {
    setScannerOpen(false)
    const food = await lookupFoodByBarcode(barcode)
    if (food) {
      setScanError(null)
      selectIngredientFood(food)
    } else {
      setScanError(t('recipeForm.noBarcodeMatch'))
    }
  }

  function addIngredientFromSearch() {
    if (!selectedFood) return
    const grams = Number(ingredientGrams) || 0
    const factor = grams / 100
    const line = `${ingredientGrams} g ${selectedFood.name}`
    setIngredients((prev) => (prev.trim() ? `${prev}\n${line}` : line))
    setKcal((prev) => String(Math.round((Number(prev) || 0) + selectedFood.kcal100g * factor)))
    setProtein((prev) => String(Math.round((Number(prev) || 0) + selectedFood.protein100g * factor)))
    setCarbs((prev) => String(Math.round((Number(prev) || 0) + selectedFood.carbs100g * factor)))
    setFat((prev) => String(Math.round((Number(prev) || 0) + selectedFood.fat100g * factor)))
    setSelectedFood(null)
    setFoodQuery('')
    setIngredientGrams('100')
  }

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
      title_en: titleEn.trim() || null,
      description_en: descriptionEn.trim() || null,
      ingredients_en: ingredientsEn.trim()
        ? ingredientsEn
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        : null,
      instructions_en: instructionsEn.trim() || null,
      meal_type: mealType,
      diet_tags: dietTags,
      free_of: freeOf,
      servings: Math.max(1, Math.round(Number(servings) || 1)),
    })
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <button type="button" onClick={onCancel} className="text-sm text-text-muted hover:text-text w-fit">
        {t('recipeForm.cancel')}
      </button>

      <label className="flex flex-col gap-1.5 text-sm">
        {t('recipeForm.titleLabel')}
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        {t('recipeForm.description')}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary resize-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        {t('recipeForm.mealTypeLabel')}
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        >
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {mealTypeLabels[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm w-28">
        {t('recipeForm.servings')}
        <input
          type="number"
          min={1}
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 font-mono outline-none focus:border-primary"
        />
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
          {t('recipeForm.proteinG')}
          <input
            type="number"
            min={0}
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          {t('recipeForm.carbsG')}
          <input
            type="number"
            min={0}
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          {t('recipeForm.fatG')}
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
        <span className="text-sm font-medium">{t('recipeForm.suitableFor')}</span>
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
              {dietTagLabels[tag]}
            </button>
          ))}
        </div>
        <TagLegend
          items={DIET_TAGS.map((tag) => ({ label: dietTagLabels[tag], description: dietTagDescriptions[tag] }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('recipeForm.freeOf')}</span>
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
              {freeOfLabels[value]}
            </button>
          ))}
        </div>
        <TagLegend
          items={FREE_OF_OPTIONS.map((value) => ({ label: freeOfLabels[value], description: freeOfDescriptions[value] }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('recipeForm.searchFoodDb')}</span>
          <button
            type="button"
            onClick={() => {
              setScanError(null)
              setScannerOpen(true)
            }}
            className="text-xs text-primary font-medium shrink-0"
          >
            {t('recipeForm.scan')}
          </button>
        </div>
        <div className="relative">
          <input
            value={foodQuery}
            onChange={(e) => {
              setFoodQuery(e.target.value)
              setSelectedFood(null)
            }}
            placeholder={t('recipeForm.foodPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {foodQuery.trim().length >= 2 && !selectedFood && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface border border-border rounded-xl max-h-56 overflow-y-auto shadow-lg">
              {foodLoading && <p className="text-xs text-text-muted px-3 py-2">{t('recipeForm.searching')}</p>}
              {!foodLoading && foodError && (
                <p className="text-xs text-danger px-3 py-2">{t('recipeForm.searchFailed')}</p>
              )}
              {!foodLoading && !foodError && foodResults.length === 0 && (
                <p className="text-xs text-text-muted px-3 py-2">{t('recipeForm.noResults')}</p>
              )}
              {foodResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectIngredientFood(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 border-b border-border last:border-none"
                >
                  <span className="block">{r.name}</span>
                  <span className="block text-xs text-text-muted font-mono">{r.kcal100g} kcal / 100 g</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedFood && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={ingredientGrams}
              onChange={(e) => setIngredientGrams(e.target.value)}
              className="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 font-mono text-sm outline-none focus:border-primary"
            />
            <span className="text-xs text-text-muted">g {selectedFood.name}</span>
            <button
              type="button"
              onClick={addIngredientFromSearch}
              className="ml-auto bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs font-medium hover:border-primary"
            >
              {t('recipeForm.add')}
            </button>
          </div>
        )}
        {scanError && <p className="text-xs text-danger">{scanError}</p>}
      </div>

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
        </Suspense>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        {t('recipeForm.ingredientsLabel')}
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={6}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary font-mono text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        {t('recipeForm.instructionsLabel')}
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
        />
      </label>

      <details className="bg-surface border border-border rounded-2xl p-4 group">
        <summary className="flex items-center justify-between gap-2 cursor-pointer text-sm font-semibold list-none">
          <span>{t('recipeForm.englishTranslation')}</span>
          <span className="text-text-muted transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="flex flex-col gap-3 mt-3">
          <p className="text-xs text-text-muted">{t('recipeForm.englishTranslationHint')}</p>
          <label className="flex flex-col gap-1.5 text-sm">
            {t('recipeForm.titleEn')}
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {t('recipeForm.descriptionEn')}
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={2}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary resize-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {t('recipeForm.ingredientsEn')}
            <textarea
              value={ingredientsEn}
              onChange={(e) => setIngredientsEn(e.target.value)}
              rows={6}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {t('recipeForm.instructionsEn')}
            <textarea
              value={instructionsEn}
              onChange={(e) => setInstructionsEn(e.target.value)}
              rows={4}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        </div>
      </details>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl py-2.5 text-sm text-text-muted border border-border"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? t('recipeForm.saving') : justSaved ? finalSavedLabel : finalSubmitLabel}
        </button>
      </div>
    </form>
  )
}
