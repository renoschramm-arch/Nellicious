import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { useRecipes, type Recipe } from '../lib/useRecipes'
import { importRecipeFromUrl } from '../lib/useRecipeImport'

type Mode = 'manuell' | 'import'

export function RecipeNewPage() {
  const { createRecipe } = useRecipes()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('manuell')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [imported, setImported] = useState<Recipe | null>(null)

  async function handleImport(e: FormEvent) {
    e.preventDefault()
    setImporting(true)
    setImportError('')
    try {
      const values = await importRecipeFromUrl(importUrl)
      setImported({
        id: '',
        owner_id: null,
        created_at: new Date().toISOString(),
        diet_tags: [],
        free_of: [],
        is_shared: false,
        ...values,
      })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display font-bold text-2xl">Neues Rezept</h1>

      <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('manuell')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'manuell' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          Manuell anlegen
        </button>
        <button
          type="button"
          onClick={() => setMode('import')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'import' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          Per Link importieren
        </button>
      </div>

      {mode === 'import' && !imported && (
        <form onSubmit={handleImport} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            Rezept-Link
            <input
              required
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.chefkoch.de/rezepte/..."
              className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <p className="text-xs text-text-muted">
            Funktioniert zuverlässig u. a. mit Chefkoch, EAT SMARTER, essen-und-trinken.de, LECKER.de, kochbar.de und
            Küchengötter — grundsätzlich mit jeder Seite, die Rezepte mit strukturierten Daten einbindet.
          </p>
          {importError && <p className="text-sm text-danger">{importError}</p>}
          <button
            type="submit"
            disabled={importing}
            className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
          >
            {importing ? 'Wird importiert …' : 'Importieren'}
          </button>
        </form>
      )}

      {(mode === 'manuell' || imported) && (
        <RecipeForm
          initial={imported ?? undefined}
          submitLabel="Rezept anlegen"
          savedLabel="Angelegt ✓"
          onCancel={() => (imported ? setImported(null) : navigate('/rezepte'))}
          onSave={async (values) => {
            const created = await createRecipe(values)
            if (created) navigate(`/rezepte/${created.id}`)
          }}
        />
      )}
    </div>
  )
}
