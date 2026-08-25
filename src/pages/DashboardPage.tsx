import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'
import { useMealLogs, useLoggingStreak } from '../lib/useMealLogs'
import { useMealPlan, type MealSlot } from '../lib/useMealPlan'
import { useRecipes, MEAL_TYPE_LABELS, type Recipe } from '../lib/useRecipes'
import { RecipePickerModal } from '../components/RecipePickerModal'
import { useFoodSearch, type FoodSearchResult } from '../lib/useFoodSearch'
import { lookupFoodByBarcode } from '../lib/lookupFoodByBarcode'
import { addDays, formatWeekdayShort, toISODate } from '../lib/week'
import { PageFlatlay } from '../components/PageFlatlay'
import { FastingRingCard } from '../components/FastingRingCard'
import { pickRandomQuote } from '../lib/motivationalQuotes'
import { takeUnseenChangelogItems } from '../lib/whatsNew'
import { getIntlLocale } from '../lib/i18n'

const GREETED_SESSION_KEY = 'nellicious-greeted'

function firstNameFrom(displayName: string | null | undefined): string | null {
  const trimmed = displayName?.trim()
  return trimmed ? trimmed.split(/\s+/)[0] : null
}

const BarcodeScannerModal = lazy(() =>
  import('../components/BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal })),
)

function todayLabel(): string {
  return new Intl.DateTimeFormat(getIntlLocale(), { weekday: 'short', day: '2-digit', month: 'long' }).format(
    new Date(),
  )
}

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'fruehstueck', label: MEAL_TYPE_LABELS.fruehstueck },
  { key: 'mittag', label: MEAL_TYPE_LABELS.mittag },
  { key: 'abend', label: MEAL_TYPE_LABELS.abend },
  { key: 'snack', label: MEAL_TYPE_LABELS.snack },
]

function nextDays(): { iso: string; label: string }[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i)
    const iso = toISODate(date)
    const label = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : formatWeekdayShort(date)
    return { iso, label }
  })
}

export function DashboardPage() {
  const { profile } = useProfile()
  const { logs, totals, addLog, removeLog } = useMealLogs()
  const { streak } = useLoggingStreak()
  const todayISO = toISODate(new Date())
  const weekAheadISO = toISODate(addDays(new Date(), 6))
  const { entries: planEntries, setEntry, removeEntry: removePlanEntry } = useMealPlan(todayISO, weekAheadISO)
  const { recipes } = useRecipes()
  const [showForm, setShowForm] = useState(false)
  const [addMode, setAddMode] = useState<'rezept' | 'manuell'>('rezept')
  const catchUpInFlight = useRef(new Set<string>())

  // Begrüßung inkl. Motivationsspruch nur einmal pro App-Start zeigen, nicht
  // bei jeder Rückkehr zur "Heute"-Ansicht innerhalb derselben Sitzung.
  const [greetingQuote, setGreetingQuote] = useState<string | null>(() => {
    if (sessionStorage.getItem(GREETED_SESSION_KEY)) return null
    sessionStorage.setItem(GREETED_SESSION_KEY, '1')
    return pickRandomQuote()
  })

  // Neuigkeiten seit dem letzten Besuch (z. B. neue Rezepte, neue Funktionen)
  // einmalig anzeigen, bis der Nutzer sie gesehen hat — unabhängig von der
  // Begrüßung oben, die pro App-Start erscheint.
  const [newsItems, setNewsItems] = useState<string[]>(() => takeUnseenChangelogItems())

  // Rezepte, die an einem früheren Tag im Wochenplan für heute eingeplant
  // wurden (z. B. gestern für "morgen" gewählt), sind zu diesem Zeitpunkt
  // noch nicht geloggt. Beim Öffnen der Heute-Ansicht holen wir das nach,
  // damit die Bilanz auch ohne erneutes manuelles Loggen stimmt.
  useEffect(() => {
    const todaysEntries = planEntries.filter((e) => e.plan_date === todayISO)
    for (const entry of todaysEntries) {
      const alreadyLogged = logs.some((l) => l.recipe_id === entry.recipe_id)
      if (alreadyLogged || catchUpInFlight.current.has(entry.recipe_id)) continue
      const recipe = recipes.find((r) => r.id === entry.recipe_id)
      if (!recipe) continue
      catchUpInFlight.current.add(entry.recipe_id)
      addLog({
        name: recipe.title,
        kcal: recipe.kcal,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        recipe_id: recipe.id,
      })
    }
  }, [planEntries, logs, recipes, todayISO, addLog])

  async function handleRemoveLog(logId: string, recipeId: string | null) {
    await removeLog(logId)
    // Ein geloggtes Rezept legt automatisch einen Planeintrag für heute an
    // (siehe RecipeDetailPage) — beim Entfernen des Logs auch den passenden
    // Planeintrag mit entfernen, damit die Einkaufsliste konsistent bleibt.
    if (!recipeId) return
    const planEntry = planEntries.find((e) => e.plan_date === todayISO && e.recipe_id === recipeId)
    if (planEntry) await removePlanEntry(planEntry.id)
  }

  async function handleAddRecipe(recipe: Recipe, date: string, slot: MealSlot) {
    if (date === todayISO) {
      await addLog({
        name: recipe.title,
        kcal: recipe.kcal,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        recipe_id: recipe.id,
      })
    }
    await setEntry(date, slot, recipe.id)
    setShowForm(false)
  }

  const goal = profile?.daily_kcal_goal ?? 2000
  const pct = Math.min(100, Math.round((totals.kcal / goal) * 100))
  const ringDeg = (pct / 100) * 360

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="dashboard.jpg" />

      {greetingQuote && (
        <div className="bg-basil/15 backdrop-blur-sm border border-basil/30 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display font-semibold text-lg text-basil">
              Hallo{firstNameFrom(profile?.display_name) ? `, ${firstNameFrom(profile?.display_name)}` : ''}! 👋
            </p>
            <p className="text-sm text-text-muted mt-1">{greetingQuote}</p>
          </div>
          <button
            onClick={() => setGreetingQuote(null)}
            aria-label="Begrüßung schließen"
            className="shrink-0 text-text-muted hover:text-text text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {newsItems.length > 0 && (
        <div className="bg-honey/15 backdrop-blur-sm border border-honey/30 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display font-semibold text-lg text-honey">🆕 Neu in Nellicious</p>
            <ul className="text-sm text-text-muted mt-1.5 flex flex-col gap-1">
              {newsItems.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setNewsItems([])}
            aria-label="Neuigkeiten schließen"
            className="shrink-0 text-text-muted hover:text-text text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <h1 className="font-display font-bold text-2xl">Heute</h1>
        <span className="font-mono text-xs text-text-muted uppercase tracking-wide">
          {todayLabel()}
        </span>
      </div>

      {streak > 0 && (
        <span className="inline-flex items-center gap-1.5 w-fit font-mono text-xs text-honey bg-honey/15 backdrop-blur-sm border border-honey/30 rounded-full px-3 py-1.5">
          🔥 {streak} {streak === 1 ? 'Tag' : 'Tage'} in Folge geloggt
        </span>
      )}

      <FastingRingCard />

      <div className="bg-surface-2 border border-border rounded-2xl p-4 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `conic-gradient(var(--basil) 0deg ${ringDeg}deg, var(--border) ${ringDeg}deg 360deg)`,
          }}
        >
          <div className="w-10 h-10 rounded-full bg-surface-2" />
        </div>
        <div className="text-sm flex-1">
          Tagesziel
          <span className="block font-mono font-medium text-base text-basil">
            {totals.kcal} / {goal} kcal
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 font-mono text-sm">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">Protein</div>
          {totals.protein_g} g
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">Kohlenhydrate</div>
          {totals.carbs_g} g
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs uppercase mb-1">Fett</div>
          {totals.fat_g} g
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-surface/85 backdrop-blur-sm border border-border rounded-2xl px-4">
        {logs.length === 0 && (
          <p className="text-text-muted text-sm py-4 text-center">
            Noch keine Mahlzeit heute erfasst.
          </p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-none"
          >
            <span className="w-2 h-2 rounded-full bg-honey shrink-0" />
            {log.recipe_id ? (
              <Link to={`/rezepte/${log.recipe_id}`} className="flex-1 text-sm hover:text-primary hover:underline">
                {log.name}
              </Link>
            ) : (
              <span className="flex-1 text-sm">{log.name}</span>
            )}
            <span className="font-mono text-xs text-text-muted">{log.kcal} kcal</span>
            <button
              onClick={() => handleRemoveLog(log.id, log.recipe_id)}
              className="text-text-muted hover:text-danger text-xs px-1"
              aria-label={`${log.name} entfernen`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
            <button
              type="button"
              onClick={() => setAddMode('rezept')}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                addMode === 'rezept' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              Rezept wählen
            </button>
            <button
              type="button"
              onClick={() => setAddMode('manuell')}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                addMode === 'manuell' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              Manuell eintragen
            </button>
          </div>

          {addMode === 'rezept' ? (
            <RecipeAddForm onCancel={() => setShowForm(false)} onAdd={handleAddRecipe} />
          ) : (
            <MealForm
              onCancel={() => setShowForm(false)}
              onSubmit={async (entry) => {
                await addLog(entry)
                setShowForm(false)
              }}
            />
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-on-primary font-semibold rounded-xl py-3 hover:bg-primary-hover transition-colors"
        >
          Mahlzeit hinzufügen
        </button>
      )}
    </div>
  )
}

function RecipeAddForm({
  onAdd,
  onCancel,
}: {
  onAdd: (recipe: Recipe, date: string, slot: MealSlot) => Promise<void>
  onCancel: () => void
}) {
  const days = nextDays()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [date, setDate] = useState(days[0].iso)
  const [slot, setSlot] = useState<MealSlot>('mittag')
  const [saving, setSaving] = useState(false)

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="text-left rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-muted hover:border-primary"
      >
        {recipe ? recipe.title : 'Rezept auswählen …'}
      </button>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-text-muted">Tag</span>
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => setDate(d.iso)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                date === d.iso ? 'bg-primary text-on-primary' : 'bg-surface-2 border border-border text-text-muted hover:text-text'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-text-muted">Mahlzeitenart</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {SLOTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSlot(s.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                slot === s.key ? 'bg-primary text-on-primary' : 'bg-surface-2 border border-border text-text-muted hover:text-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl py-2.5 text-sm text-text-muted border border-border"
        >
          Abbrechen
        </button>
        <button
          type="button"
          disabled={!recipe || saving}
          onClick={async () => {
            if (!recipe) return
            setSaving(true)
            await onAdd(recipe, date, slot)
            setSaving(false)
          }}
          className="flex-1 bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? 'Wird gespeichert …' : 'Hinzufügen'}
        </button>
      </div>

      {pickerOpen && (
        <RecipePickerModal
          onSelect={(r) => {
            setRecipe(r)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

function MealForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (entry: { name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const [foodQuery, setFoodQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [grams, setGrams] = useState('100')
  const { results, loading, error } = useFoodSearch(foodQuery)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  function selectFood(food: FoodSearchResult) {
    setSelectedFood(food)
    setFoodQuery(food.name)
    setName(food.name)
  }

  async function handleBarcodeDetected(barcode: string) {
    setScannerOpen(false)
    const food = await lookupFoodByBarcode(barcode)
    if (food) {
      setScanError(null)
      selectFood(food)
    } else {
      setScanError('Kein Treffer für diesen Barcode gefunden. Bitte manuell suchen oder eintragen.')
    }
  }

  useEffect(() => {
    if (!selectedFood) return
    const factor = (Number(grams) || 0) / 100
    setKcal(String(Math.round(selectedFood.kcal100g * factor)))
    setProtein(String(Math.round(selectedFood.protein100g * factor)))
    setCarbs(String(Math.round(selectedFood.carbs100g * factor)))
    setFat(String(Math.round(selectedFood.fat100g * factor)))
  }, [selectedFood, grams])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name || !kcal) return
    onSubmit({
      name,
      kcal: Number(kcal),
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1 text-sm relative">
        <div className="flex items-center justify-between">
          <span>Lebensmittel suchen (optional)</span>
          <button
            type="button"
            onClick={() => {
              setScanError(null)
              setScannerOpen(true)
            }}
            className="text-xs text-primary font-medium shrink-0"
          >
            📷 Scannen
          </button>
        </div>
        <input
          value={foodQuery}
          onChange={(e) => {
            setFoodQuery(e.target.value)
            setSelectedFood(null)
          }}
          placeholder="z. B. Basmati Reis"
          className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
        />
        {foodQuery.trim().length >= 2 && !selectedFood && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface border border-border rounded-xl max-h-56 overflow-y-auto shadow-lg">
            {loading && <p className="text-xs text-text-muted px-3 py-2">Suche …</p>}
            {!loading && error && (
              <p className="text-xs text-danger px-3 py-2">Suche fehlgeschlagen. Bitte manuell eintragen.</p>
            )}
            {!loading && !error && results.length === 0 && (
              <p className="text-xs text-text-muted px-3 py-2">Keine Treffer.</p>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectFood(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 border-b border-border last:border-none"
              >
                <span className="block">{r.name}</span>
                <span className="block text-xs text-text-muted font-mono">{r.kcal100g} kcal / 100 g</span>
              </button>
            ))}
          </div>
        )}
        {scanError && <p className="text-xs text-danger">{scanError}</p>}
      </div>

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
        </Suspense>
      )}

      {selectedFood && (
        <label className="flex flex-col gap-1 text-sm">
          Menge (g)
          <input
            type="number"
            min={1}
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 font-mono outline-none focus:border-primary"
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Bezeichnung
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Linsen-Bowl mit Ofengemüse"
          className="rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
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
            className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Protein g
          <input
            type="number"
            min={0}
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Kohlenh. g
          <input
            type="number"
            min={0}
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Fett g
          <input
            type="number"
            min={0}
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 font-mono outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl py-2.5 text-sm text-text-muted border border-border"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
        >
          Speichern
        </button>
      </div>
    </form>
  )
}
