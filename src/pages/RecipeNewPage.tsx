import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RecipeForm } from '../components/RecipeForm'
import { useRecipes, type Recipe } from '../lib/useRecipes'
import { importRecipeFromUrl } from '../lib/useRecipeImport'
import { estimateNutritionFromIngredients, type NutritionEstimate } from '../lib/estimateNutrition'

type Mode = 'manuell' | 'import'

export function RecipeNewPage() {
  const { t } = useTranslation()
  const { createRecipe } = useRecipes()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('manuell')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [imported, setImported] = useState<Recipe | null>(null)
  const [nutritionEstimate, setNutritionEstimate] = useState<NutritionEstimate | null>(null)

  async function handleImport(e: FormEvent) {
    e.preventDefault()
    setImporting(true)
    setImportError('')
    try {
      const values = await importRecipeFromUrl(importUrl)

      // Manche Seiten liefern keine eigenen Nährwertangaben — in dem Fall
      // aus der erkannten Zutatenliste schätzen, statt stillschweigend bei
      // 0 kcal/0g zu landen.
      let estimate: NutritionEstimate | null = null
      if (values.kcal === 0 && values.protein_g === 0 && values.carbs_g === 0 && values.fat_g === 0) {
        estimate = estimateNutritionFromIngredients(values.ingredients)
      }
      setNutritionEstimate(estimate)

      setImported({
        id: '',
        owner_id: null,
        created_at: new Date().toISOString(),
        diet_tags: [],
        free_of: [],
        is_shared: false,
        ...values,
        ...(estimate
          ? {
              kcal: estimate.kcal,
              protein_g: estimate.protein_g,
              carbs_g: estimate.carbs_g,
              fat_g: estimate.fat_g,
            }
          : {}),
        servings: values.servings ?? 1,
      })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('recipeNew.importFailed'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display font-bold text-2xl">{t('recipeNew.title')}</h1>

      <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('manuell')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'manuell' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          {t('recipeNew.manualTab')}
        </button>
        <button
          type="button"
          onClick={() => setMode('import')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'import' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          {t('recipeNew.importTab')}
        </button>
      </div>

      {mode === 'import' && !imported && (
        <form onSubmit={handleImport} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            {t('recipeNew.recipeLink')}
            <input
              required
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.chefkoch.de/rezepte/..."
              className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <p className="text-xs text-text-muted">{t('recipeNew.importHint')}</p>
          {importError && <p className="text-sm text-danger">{importError}</p>}
          <button
            type="submit"
            disabled={importing}
            className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
          >
            {importing ? t('recipeNew.importing') : t('recipeNew.import')}
          </button>
        </form>
      )}

      {imported && nutritionEstimate && (
        <p className="text-xs text-honey bg-honey/10 border border-honey/30 rounded-xl px-3 py-2.5">
          {t('recipeNew.nutritionEstimated', {
            matched: nutritionEstimate.matchedCount,
            total: nutritionEstimate.totalCount,
          })}
        </p>
      )}

      {(mode === 'manuell' || imported) && (
        <RecipeForm
          initial={imported ?? undefined}
          submitLabel={t('recipeNew.createRecipe')}
          savedLabel={t('recipeNew.created')}
          onCancel={() => {
            if (imported) {
              setImported(null)
              setNutritionEstimate(null)
            } else {
              navigate('/rezepte')
            }
          }}
          onSave={async (values) => {
            const created = await createRecipe(values)
            if (created) navigate(`/rezepte/${created.id}`)
          }}
        />
      )}
    </div>
  )
}
