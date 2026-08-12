import { useMemo, useState } from 'react'
import { PageFlatlay } from '../components/PageFlatlay'
import { useMealPlan, type MealSlot } from '../lib/useMealPlan'
import { useRecipes } from '../lib/useRecipes'
import { useShoppingListStatus, type IngredientRef } from '../lib/useShoppingListStatus'
import { RecipePicker } from '../components/RecipePicker'
import { addDays, formatDayLabel, formatWeekRange, getMonday, toISODate } from '../lib/week'
import { scaleIngredient } from '../lib/scaleIngredient'

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
  const [weekOffset, setWeekOffset] = useState(0)
  const monday = useMemo(() => addDays(getMonday(new Date()), weekOffset * 7), [weekOffset])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday])
  const weekStartISO = toISODate(days[0])
  const weekEndISO = toISODate(days[6])

  const { entries, setEntry, removeEntry } = useMealPlan(weekStartISO, weekEndISO)
  const { recipes } = useRecipes()
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])

  const entryIds = useMemo(() => entries.map((e) => e.id), [entries])
  const { isChecked, isDismissed, setChecked, setDismissed } = useShoppingListStatus(entryIds)

  const [openPicker, setOpenPicker] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [shoppingView, setShoppingView] = useState<'grouped' | 'flat'>('grouped')

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
      <li key={line.key} className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
          <input
            type="checkbox"
            checked={line.checked}
            onChange={() => setChecked(line.refs, !line.checked)}
            className="accent-[var(--primary)]"
          />
          <span className={line.checked ? 'line-through text-text-muted' : ''}>{line.text}</span>
        </label>
        <button
          onClick={() => dismissLine(line.refs)}
          className="text-text-muted hover:text-danger text-xs px-1"
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
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-2 py-1 rounded-lg border border-border text-sm text-text-muted hover:text-text"
            aria-label="Vorherige Woche"
          >
            ←
          </button>
          <span className="font-mono text-xs text-text-muted">
            {formatWeekRange(days[0], days[6])}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-2 py-1 rounded-lg border border-border text-sm text-text-muted hover:text-text"
            aria-label="Nächste Woche"
          >
            →
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const dateISO = toISODate(day)
          return (
            <div key={dateISO} className="bg-surface border border-border rounded-2xl p-4">
              <div className="font-display font-semibold mb-3">{formatDayLabel(day)}</div>
              <div className="flex flex-col gap-2">
                {SLOTS.map((slot) => {
                  const entry = entryFor(dateISO, slot.key)
                  const recipe = entry ? recipeById.get(entry.recipe_id) : undefined
                  const isPickerOpen = openPicker?.date === dateISO && openPicker?.slot === slot.key
                  return (
                    <div key={slot.key} className="relative flex items-center gap-3 text-sm">
                      <span className="w-20 shrink-0 text-text-muted text-xs uppercase tracking-wide">
                        {slot.label}
                      </span>
                      {recipe ? (
                        <>
                          <span className="flex-1">{recipe.title}</span>
                          <span className="font-mono text-xs text-text-muted">{recipe.kcal} kcal</span>
                          <button
                            onClick={() => entry && removeEntry(entry.id)}
                            className="text-text-muted hover:text-danger text-xs px-1"
                            aria-label={`${recipe.title} aus Plan entfernen`}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setOpenPicker(isPickerOpen ? null : { date: dateISO, slot: slot.key })}
                          className="flex-1 text-left text-text-muted hover:text-primary"
                        >
                          + Rezept wählen
                        </button>
                      )}
                      {isPickerOpen && (
                        <RecipePicker
                          onSelect={(recipeId) => {
                            setEntry(dateISO, slot.key, recipeId)
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
    </div>
  )
}
