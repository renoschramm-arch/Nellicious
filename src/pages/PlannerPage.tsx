import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageFlatlay } from '../components/PageFlatlay'
import { useMealPlan, type MealSlot } from '../lib/useMealPlan'
import { useRecipes, type Recipe } from '../lib/useRecipes'
import { useMealLogs } from '../lib/useMealLogs'
import { useShoppingListStatus, type IngredientRef } from '../lib/useShoppingListStatus'
import { RecipePickerModal } from '../components/RecipePickerModal'
import { MultiAssignModal, type Selection } from '../components/MultiAssignModal'
import { PremiumModal } from '../components/PremiumModal'
import { usePremium } from '../lib/usePremium'
import { addDays, formatDayLabel, formatWeekRange, getMonday, toISODate } from '../lib/week'
import { scaleIngredient } from '../lib/scaleIngredient'

interface MultiAssignNavState {
  multiAssignRecipeId: string
  suggestedCount: number
}

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'fruehstueck', label: 'Frühstück' },
  { key: 'mittag', label: 'Mittag' },
  { key: 'abend', label: 'Abend' },
  { key: 'snack', label: 'Snack' },
]

interface LeafItem {
  entryId: string
  recipeId: string
  recipeTitle: string
  index: number
  text: string
  checked: boolean
}

interface ShoppingLine {
  key: string
  text: string
  checked: boolean
  refs: IngredientRef[]
}

export function PlannerPage() {
  const { hasPremium } = usePremium()
  const [weekOffset, setWeekOffset] = useState(0)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const monday = useMemo(() => addDays(getMonday(new Date()), weekOffset * 7), [weekOffset])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday])
  const weekStartISO = toISODate(days[0])
  const weekEndISO = toISODate(days[6])

  const { entries, setEntry, removeEntry } = useMealPlan(weekStartISO, weekEndISO)
  const { recipes } = useRecipes()
  const { logs: todayLogs, addLog, removeLog } = useMealLogs()
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])

  const entryIds = useMemo(() => entries.map((e) => e.id), [entries])
  const { isChecked, isDismissed, setChecked, setDismissed } = useShoppingListStatus(entryIds)

  const [openPicker, setOpenPicker] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [shoppingView, setShoppingView] = useState<'grouped' | 'flat'>('grouped')
  const todayISO = toISODate(new Date())

  const [multiPickerOpen, setMultiPickerOpen] = useState(false)
  const [multiAssignRecipe, setMultiAssignRecipe] = useState<Recipe | null>(null)
  const [multiAssignSuggestedCount, setMultiAssignSuggestedCount] = useState<number | undefined>(undefined)

  const location = useLocation()
  const navigate = useNavigate()

  // Von der Rezeptseite aus ("In den Plan übernehmen") kommt die Ziel-Recipe-ID
  // + Portionenzahl über den Router-State an — sobald die Rezepte geladen sind,
  // öffnet sich die Mehrfach-Zuweisung direkt damit vorausgefüllt.
  useEffect(() => {
    const navState = location.state as MultiAssignNavState | null
    if (!navState || recipes.length === 0) return
    const recipe = recipeById.get(navState.multiAssignRecipeId)
    if (recipe) {
      setMultiAssignRecipe(recipe)
      setMultiAssignSuggestedCount(navState.suggestedCount)
    }
    navigate(location.pathname, { replace: true, state: null })
  }, [location, recipes, recipeById, navigate])

  // Ein Rezept, das für heute eingeplant wird, zählt sofort als gegessen —
  // ohne diese Synchronisierung würde die "Heute"-Ansicht auf dem Dashboard
  // Rezepte ignorieren, die hier statt über "Mahlzeit hinzufügen" eingetragen
  // wurden.
  async function selectRecipe(dateISO: string, slot: MealSlot, recipe: Recipe) {
    await setEntry(dateISO, slot, recipe.id)
    if (dateISO === todayISO) {
      await addLog({
        name: recipe.title,
        kcal: recipe.kcal,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        recipe_id: recipe.id,
      })
    }
  }

  function openMultiAssign() {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    setMultiAssignSuggestedCount(undefined)
    setMultiPickerOpen(true)
  }

  async function handleMultiAssign(selections: Selection[]) {
    if (!multiAssignRecipe) return
    for (const { date, slot } of selections) {
      await selectRecipe(date, slot, multiAssignRecipe)
    }
    setMultiAssignRecipe(null)
    setMultiAssignSuggestedCount(undefined)
  }

  async function removePlanEntry(dateISO: string, entryId: string, recipeId: string) {
    await removeEntry(entryId)
    if (dateISO === todayISO) {
      const log = todayLogs.find((l) => l.recipe_id === recipeId)
      if (log) await removeLog(log.id)
    }
  }

  // Nur die laufende Woche ist ohne Premium einsehbar — vor und zurück
  // blättern setzt eine aktive Premium-Mitgliedschaft (oder Testphase) voraus.
  function goToWeek(nextOffset: number) {
    if (nextOffset !== 0 && !hasPremium) {
      setShowPremiumModal(true)
      return
    }
    setWeekOffset(nextOffset)
  }

  function entryFor(date: string, slot: MealSlot) {
    return entries.find((e) => e.plan_date === date && e.meal_slot === slot)
  }

  // Every not-yet-dismissed ingredient line across all planned entries. Bound to the
  // specific meal-plan entry + ingredient position, not to a calendar week — so it
  // only reappears once a recipe is planned again for another day, never on its own.
  const leafItems = useMemo(() => {
    const items: LeafItem[] = []
    for (const entry of entries) {
      const recipe = recipeById.get(entry.recipe_id)
      if (!recipe) continue
      recipe.ingredients.forEach((text, index) => {
        if (isDismissed(entry.id, index)) return
        items.push({
          entryId: entry.id,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          index,
          text,
          checked: isChecked(entry.id, index),
        })
      })
    }
    return items
  }, [entries, recipeById, isChecked, isDismissed])

  const groupedByRecipe = useMemo(() => {
    const byRecipe = new Map<string, { recipeTitle: string; byIndex: Map<number, LeafItem[]> }>()
    for (const leaf of leafItems) {
      let group = byRecipe.get(leaf.recipeId)
      if (!group) {
        group = { recipeTitle: leaf.recipeTitle, byIndex: new Map() }
        byRecipe.set(leaf.recipeId, group)
      }
      const list = group.byIndex.get(leaf.index) ?? []
      list.push(leaf)
      group.byIndex.set(leaf.index, list)
    }
    return Array.from(byRecipe.entries()).map(([recipeId, group]) => ({
      recipeId,
      recipeTitle: group.recipeTitle,
      lines: Array.from(group.byIndex.entries())
        .sort(([a], [b]) => a - b)
        .map(([index, leaves]): ShoppingLine => ({
          key: `${recipeId}-${index}`,
          text: scaleIngredient(leaves[0].text, leaves.length),
          checked: leaves.every((l) => l.checked),
          refs: leaves.map((l) => ({ entryId: l.entryId, index: l.index })),
        })),
    }))
  }, [leafItems])

  const flatLines = useMemo(() => {
    const byText = new Map<string, LeafItem[]>()
    for (const leaf of leafItems) {
      const list = byText.get(leaf.text) ?? []
      list.push(leaf)
      byText.set(leaf.text, list)
    }
    return Array.from(byText.entries()).map(([text, leaves]): ShoppingLine => ({
      key: text,
      text: scaleIngredient(text, leaves.length),
      checked: leaves.every((l) => l.checked),
      refs: leaves.map((l) => ({ entryId: l.entryId, index: l.index })),
    }))
  }, [leafItems])

  const hasPlannedRecipes = entries.some((e) => (recipeById.get(e.recipe_id)?.ingredients.length ?? 0) > 0)
  const hasVisibleItems = leafItems.length > 0

  function dismissLine(refs: IngredientRef[]) {
    setDismissed(refs)
  }

  function clearShoppingList() {
    setDismissed(leafItems.map((l) => ({ entryId: l.entryId, index: l.index })))
  }

  function renderLine(line: ShoppingLine) {
    return (
      <li key={line.key} className="flex items-center gap-2 py-1 border-b border-border last:border-none">
        <label className="flex items-center gap-3 py-1.5 cursor-pointer flex-1 min-w-0">
          <input
            type="checkbox"
            checked={line.checked}
            onChange={() => setChecked(line.refs, !line.checked)}
            className="w-5 h-5 shrink-0 accent-[var(--primary)]"
          />
          <span className={`text-sm truncate ${line.checked ? 'line-through text-text-muted' : ''}`}>
            {line.text}
          </span>
        </label>
        <button
          onClick={() => dismissLine(line.refs)}
          className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted hover:border-primary hover:text-danger text-xs transition-colors"
          aria-label={`${line.text} aus Einkaufsliste entfernen`}
        >
          ✕
        </button>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="planner.png" />
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Wochenplan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToWeek(weekOffset - 1)}
            className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-border text-text-muted hover:border-primary hover:text-text transition-colors"
            aria-label="Vorherige Woche"
          >
            ←
          </button>
          <span className="font-mono text-xs text-text-muted min-w-[74px] text-center">
            {formatWeekRange(days[0], days[6])}
          </span>
          <button
            onClick={() => goToWeek(weekOffset + 1)}
            className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-border text-text-muted hover:border-primary hover:text-text transition-colors"
            aria-label="Nächste Woche"
          >
            →
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={openMultiAssign}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/90 backdrop-blur-sm py-2.5 text-sm font-medium text-text hover:border-primary transition-colors"
      >
        🍽️ Rezept mehrfach einplanen{!hasPremium && ' 🔒'}
      </button>

      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const dateISO = toISODate(day)
          const isToday = dateISO === todayISO
          return (
            <div
              key={dateISO}
              className={`bg-surface border rounded-2xl p-4 ${
                isToday ? 'border-primary/45 shadow-[0_0_0_1px_rgba(182,52,32,0.2)]' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-display font-semibold">{formatDayLabel(day)}</span>
                {isToday && (
                  <span className="font-mono text-[10px] uppercase tracking-wide bg-primary text-on-primary rounded-full px-2 py-0.5">
                    Heute
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {SLOTS.map((slot) => {
                  const entry = entryFor(dateISO, slot.key)
                  const recipe = entry ? recipeById.get(entry.recipe_id) : undefined
                  const isPickerOpen = openPicker?.date === dateISO && openPicker?.slot === slot.key
                  return (
                    <div key={slot.key}>
                      {recipe ? (
                        <div className="flex items-center gap-3 min-h-[52px] bg-surface-2 border border-border rounded-2xl px-3.5 py-2.5">
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="font-mono text-[10px] uppercase tracking-wide text-basil">
                              {slot.label}
                            </span>
                            <span className="text-[15px] font-medium truncate">{recipe.title}</span>
                          </div>
                          <span className="font-mono text-xs text-text-muted shrink-0">{recipe.kcal} kcal</span>
                          <button
                            onClick={() => entry && removePlanEntry(dateISO, entry.id, entry.recipe_id)}
                            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-full bg-surface border border-border text-text-muted hover:border-primary hover:text-danger text-xs transition-colors"
                            aria-label={`${recipe.title} aus Plan entfernen`}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setOpenPicker(isPickerOpen ? null : { date: dateISO, slot: slot.key })}
                          className="w-full min-h-[52px] flex items-center gap-3 bg-bg border border-dashed border-border rounded-2xl px-3.5 py-2.5 text-left hover:border-primary transition-colors"
                        >
                          <span className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-full bg-surface-2 text-text-muted text-sm">
                            +
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
                              {slot.label}
                            </span>
                            <span className="text-[14.5px] font-medium">Rezept wählen</span>
                          </span>
                        </button>
                      )}
                      {isPickerOpen && (
                        <RecipePickerModal
                          defaultMealType={slot.key}
                          onSelect={(recipe) => {
                            selectRecipe(dateISO, slot.key, recipe)
                            setOpenPicker(null)
                          }}
                          onClose={() => setOpenPicker(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg">Einkaufsliste</h2>
          {hasPlannedRecipes && (
            <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1">
              <button
                onClick={() => setShoppingView('grouped')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  shoppingView === 'grouped' ? 'bg-primary text-on-primary' : 'text-text-muted'
                }`}
              >
                Nach Rezept
              </button>
              <button
                onClick={() => setShoppingView('flat')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  shoppingView === 'flat' ? 'bg-primary text-on-primary' : 'text-text-muted'
                }`}
              >
                Als Liste
              </button>
            </div>
          )}
        </div>

        {!hasPlannedRecipes ? (
          <p className="text-text-muted text-sm bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-4">
            Noch keine Rezepte für diese Woche geplant.
          </p>
        ) : !hasVisibleItems ? (
          <p className="text-text-muted text-sm bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-4">
            Einkauf erledigt — nichts mehr auf der Liste. 🎉
          </p>
        ) : shoppingView === 'grouped' ? (
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-4">
            {groupedByRecipe.map((group) => (
              <div key={group.recipeId}>
                <div className="text-xs font-mono uppercase tracking-wide text-text-muted mb-1.5">
                  {group.recipeTitle}
                </div>
                <ul className="flex flex-col gap-1">{group.lines.map(renderLine)}</ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <ul className="flex flex-col gap-1">{flatLines.map(renderLine)}</ul>
          </div>
        )}

        {hasVisibleItems && (
          <button
            onClick={clearShoppingList}
            className="w-full mt-3 border border-border bg-surface/80 backdrop-blur-sm rounded-xl py-2.5 text-sm text-text-muted hover:text-text"
          >
            Einkauf erledigt
          </button>
        )}
      </div>

      {multiPickerOpen && (
        <RecipePickerModal
          onSelect={(recipe) => {
            setMultiPickerOpen(false)
            setMultiAssignRecipe(recipe)
          }}
          onClose={() => setMultiPickerOpen(false)}
        />
      )}

      {multiAssignRecipe && (
        <MultiAssignModal
          recipe={multiAssignRecipe}
          days={days}
          suggestedCount={multiAssignSuggestedCount}
          occupiedTitleFor={(dateISO, slot) => {
            const entry = entryFor(dateISO, slot)
            return entry ? recipeById.get(entry.recipe_id)?.title : undefined
          }}
          onAssign={handleMultiAssign}
          onClose={() => {
            setMultiAssignRecipe(null)
            setMultiAssignSuggestedCount(undefined)
          }}
        />
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  )
}
