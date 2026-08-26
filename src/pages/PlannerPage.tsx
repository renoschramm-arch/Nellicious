import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageFlatlay } from '../components/PageFlatlay'
import { useMealPlan, type MealSlot } from '../lib/useMealPlan'
import { useRecipes, getMealTypeLabels, localizeRecipeText, type Recipe } from '../lib/useRecipes'
import { useMealLogs } from '../lib/useMealLogs'
import { useShoppingListStatus, type IngredientRef } from '../lib/useShoppingListStatus'
import { useProfile } from '../lib/useProfile'
import { useFavorites } from '../lib/useFavorites'
import { RecipePickerModal } from '../components/RecipePickerModal'
import { MultiAssignModal, type Selection } from '../components/MultiAssignModal'
import { AutoPlanModal } from '../components/AutoPlanModal'
import { PremiumModal } from '../components/PremiumModal'
import { usePremium } from '../lib/usePremium'
import { addDays, formatDayLabel, formatWeekRange, getMonday, toISODate } from '../lib/week'
import { scaleIngredient } from '../lib/scaleIngredient'
import { generateAutoPlan, type AutoPlanSlot } from '../lib/autoPlan'

interface MultiAssignNavState {
  multiAssignRecipeId: string
  suggestedCount: number
}

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
  recipeIds?: string[]
}

const RECIPE_ACCENT_COUNT = 6

export function PlannerPage() {
  const { t, i18n } = useTranslation()
  const SLOTS: { key: MealSlot; label: string }[] = useMemo(() => {
    const labels = getMealTypeLabels(t)
    return [
      { key: 'fruehstueck', label: labels.fruehstueck },
      { key: 'mittag', label: labels.mittag },
      { key: 'abend', label: labels.abend },
      { key: 'snack', label: labels.snack },
    ]
  }, [t])
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
  const { profile } = useProfile()
  const { favoriteIds } = useFavorites()
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])

  const entryIds = useMemo(() => entries.map((e) => e.id), [entries])
  const { isChecked, isDismissed, setChecked, setDismissed } = useShoppingListStatus(entryIds)

  const [openPicker, setOpenPicker] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [shoppingView, setShoppingView] = useState<'grouped' | 'flat'>('grouped')
  const todayISO = toISODate(new Date())

  const [multiPickerOpen, setMultiPickerOpen] = useState(false)
  const [multiAssignRecipe, setMultiAssignRecipe] = useState<Recipe | null>(null)
  const [multiAssignSuggestedCount, setMultiAssignSuggestedCount] = useState<number | undefined>(undefined)
  const [autoPlanOpen, setAutoPlanOpen] = useState(false)

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
        name: localizeRecipeText(recipe, i18n.language).title,
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

  function openAutoPlan() {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    setAutoPlanOpen(true)
  }

  async function handleAutoPlan(slots: MealSlot[], overwrite: boolean): Promise<AutoPlanSlot[]> {
    if (!profile) return []
    const { assignments, unfilled } = generateAutoPlan(
      recipes,
      profile,
      favoriteIds,
      (dateISO, slot) => entryFor(dateISO, slot) != null,
      { days, slots, overwrite },
    )
    for (const { date, slot, recipe } of assignments) {
      await selectRecipe(date, slot, recipe)
    }
    return unfilled
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
      const localized = localizeRecipeText(recipe, i18n.language)
      localized.ingredients.forEach((text, index) => {
        if (isDismissed(entry.id, index)) return
        items.push({
          entryId: entry.id,
          recipeId: recipe.id,
          recipeTitle: localized.title,
          index,
          text,
          checked: isChecked(entry.id, index),
        })
      })
    }
    return items
  }, [entries, recipeById, isChecked, isDismissed, i18n.language])

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

  // Position in der aktuell sichtbaren Rezeptliste statt Hash über die
  // Rezept-ID — ein Hash kann mehrere Rezepte zufällig auf denselben von
  // 6 Farb-Slots mappen (Kollision), was zwei verschiedene Rezepte optisch
  // ununterscheidbar macht. Reihenfolge sorgt dafür, dass alle gleichzeitig
  // geplanten Rezepte bis einschließlich 6 garantiert unterschiedliche
  // Farben bekommen; ab dem 7. wiederholt sich die Palette.
  const recipeColorIndex = useMemo(() => {
    const map = new Map<string, number>()
    groupedByRecipe.forEach((group, i) => map.set(group.recipeId, i % RECIPE_ACCENT_COUNT))
    return map
  }, [groupedByRecipe])

  function recipeAccent(recipeId: string): number {
    return recipeColorIndex.get(recipeId) ?? 0
  }

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
      recipeIds: Array.from(new Set(leaves.map((l) => l.recipeId))),
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
          {line.recipeIds && line.recipeIds.length > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              {line.recipeIds.map((recipeId) => (
                <span
                  key={recipeId}
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: `var(--recipe-${recipeAccent(recipeId)})` }}
                  aria-hidden
                />
              ))}
            </span>
          )}
          <span className={`text-sm truncate ${line.checked ? 'line-through text-text-muted' : ''}`}>
            {line.text}
          </span>
        </label>
        <button
          onClick={() => dismissLine(line.refs)}
          className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted hover:border-primary hover:text-danger text-xs transition-colors"
          aria-label={t('planner.removeFromListAria', { text: line.text })}
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
        <h1 className="font-display font-bold text-2xl">{t('planner.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToWeek(weekOffset - 1)}
            className="relative w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-border text-text-muted hover:border-primary hover:text-text transition-colors"
            aria-label={hasPremium ? t('planner.prevWeek') : `${t('planner.prevWeek')} 🔒`}
          >
            ←
            {!hasPremium && (
              <span aria-hidden className="absolute -top-1.5 -right-1.5 text-[10px] leading-none">🔒</span>
            )}
          </button>
          <span className="font-mono text-xs text-text-muted min-w-[74px] text-center">
            {formatWeekRange(days[0], days[6])}
          </span>
          <button
            onClick={() => goToWeek(weekOffset + 1)}
            className="relative w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-border text-text-muted hover:border-primary hover:text-text transition-colors"
            aria-label={hasPremium ? t('planner.nextWeek') : `${t('planner.nextWeek')} 🔒`}
          >
            →
            {!hasPremium && (
              <span aria-hidden className="absolute -top-1.5 -right-1.5 text-[10px] leading-none">🔒</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={openMultiAssign}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/90 backdrop-blur-sm py-2.5 text-sm font-medium text-text hover:border-primary transition-colors"
        >
          {t('planner.multiAssignButton')}{!hasPremium && ' 🔒'}
        </button>
        <button
          type="button"
          onClick={openAutoPlan}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/90 backdrop-blur-sm py-2.5 text-sm font-medium text-text hover:border-primary transition-colors"
        >
          {t('planner.autoPlanButton')}{!hasPremium && ' 🔒'}
        </button>
      </div>

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
                    {t('planner.today')}
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
                          <Link
                            to={`/rezepte/${recipe.id}`}
                            className="flex-1 min-w-0 flex flex-col gap-0.5 hover:text-primary"
                          >
                            <span className="font-mono text-[10px] uppercase tracking-wide text-basil">
                              {slot.label}
                            </span>
                            <span className="text-[15px] font-medium truncate">
                              {localizeRecipeText(recipe, i18n.language).title}
                            </span>
                          </Link>
                          <span className="font-mono text-xs text-text-muted shrink-0">{recipe.kcal} kcal</span>
                          <button
                            onClick={() => entry && removePlanEntry(dateISO, entry.id, entry.recipe_id)}
                            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-full bg-surface border border-border text-text-muted hover:border-primary hover:text-danger text-xs transition-colors"
                            aria-label={t('planner.removeFromPlanAria', {
                              title: localizeRecipeText(recipe, i18n.language).title,
                            })}
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
                            <span className="text-[14.5px] font-medium">{t('planner.selectRecipe')}</span>
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
          <h2 className="font-display font-semibold text-lg">{t('planner.shoppingList')}</h2>
          {hasPlannedRecipes && (
            <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1">
              <button
                onClick={() => setShoppingView('grouped')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  shoppingView === 'grouped' ? 'bg-primary text-on-primary' : 'text-text-muted'
                }`}
              >
                {t('planner.byRecipe')}
              </button>
              <button
                onClick={() => setShoppingView('flat')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  shoppingView === 'flat' ? 'bg-primary text-on-primary' : 'text-text-muted'
                }`}
              >
                {t('planner.asList')}
              </button>
            </div>
          )}
        </div>

        {!hasPlannedRecipes ? (
          <p className="text-text-muted text-sm bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-4">
            {t('planner.noRecipesPlanned')}
          </p>
        ) : !hasVisibleItems ? (
          <p className="text-text-muted text-sm bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-4">
            {t('planner.shoppingDone')}
          </p>
        ) : shoppingView === 'grouped' ? (
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
            {groupedByRecipe.map((group) => {
              const accent = recipeAccent(group.recipeId)
              return (
                <div
                  key={group.recipeId}
                  className="rounded-xl p-3"
                  style={{ background: `rgba(var(--recipe-${accent}-rgb), 0.09)` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: `var(--recipe-${accent})` }}
                      aria-hidden
                    />
                    <span className="text-xs font-mono uppercase tracking-wide text-text-muted">
                      {group.recipeTitle}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1">{group.lines.map(renderLine)}</ul>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3 pb-3 border-b border-border">
              {groupedByRecipe.map((group) => (
                <span key={group.recipeId} className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: `var(--recipe-${recipeAccent(group.recipeId)})` }}
                    aria-hidden
                  />
                  {group.recipeTitle}
                </span>
              ))}
            </div>
            <ul className="flex flex-col gap-1">{flatLines.map(renderLine)}</ul>
          </div>
        )}

        {hasVisibleItems && (
          <button
            onClick={clearShoppingList}
            className="w-full mt-3 border border-border bg-surface/80 backdrop-blur-sm rounded-xl py-2.5 text-sm text-text-muted hover:text-text"
          >
            {t('planner.clearShoppingList')}
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
            const occupiedRecipe = entry ? recipeById.get(entry.recipe_id) : undefined
            return occupiedRecipe ? localizeRecipeText(occupiedRecipe, i18n.language).title : undefined
          }}
          onAssign={handleMultiAssign}
          onClose={() => {
            setMultiAssignRecipe(null)
            setMultiAssignSuggestedCount(undefined)
          }}
        />
      )}

      {autoPlanOpen && <AutoPlanModal onRun={handleAutoPlan} onClose={() => setAutoPlanOpen(false)} />}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  )
}
