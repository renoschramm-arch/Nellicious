import { useMemo, useState } from 'react'
import { useMealPlan, type MealSlot } from '../lib/useMealPlan'
import { useRecipes } from '../lib/useRecipes'
import { RecipePicker } from '../components/RecipePicker'
import { addDays, formatDayLabel, formatWeekRange, getMonday, toISODate } from '../lib/week'
import { scaleIngredient } from '../lib/scaleIngredient'

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'fruehstueck', label: 'Frühstück' },
  { key: 'mittag', label: 'Mittag' },
  { key: 'abend', label: 'Abend' },
  { key: 'snack', label: 'Snack' },
]

export function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const monday = useMemo(() => addDays(getMonday(new Date()), weekOffset * 7), [weekOffset])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday])
  const weekStartISO = toISODate(days[0])
  const weekEndISO = toISODate(days[6])

  const { entries, setEntry, removeEntry } = useMealPlan(weekStartISO, weekEndISO)
  const { recipes } = useRecipes()
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])

  const [openPicker, setOpenPicker] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [shoppingView, setShoppingView] = useState<'grouped' | 'flat'>('grouped')

  function entryFor(date: string, slot: MealSlot) {
    return entries.find((e) => e.plan_date === date && e.meal_slot === slot)
  }

  const shoppingGroups = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of entries) {
      counts.set(entry.recipe_id, (counts.get(entry.recipe_id) ?? 0) + 1)
    }
    const seen = new Set<string>()
    const groups: { recipeTitle: string; count: number; items: string[] }[] = []
    for (const entry of entries) {
      const recipe = recipeById.get(entry.recipe_id)
      if (!recipe || recipe.ingredients.length === 0 || seen.has(recipe.id)) continue
      seen.add(recipe.id)
      const count = counts.get(recipe.id) ?? 1
      groups.push({
        recipeTitle: recipe.title,
        count,
        items: recipe.ingredients.map((ing) => scaleIngredient(ing, count)),
      })
    }
    return groups
  }, [entries, recipeById])

  const flatItems = useMemo(() => {
    const counts = new Map<string, number>()
    for (const group of shoppingGroups) {
      for (const item of group.items) {
        counts.set(item, (counts.get(item) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries()).map(([item, count]) => scaleIngredient(item, count))
  }, [shoppingGroups])

  const visibleGroups = useMemo(
    () =>
      shoppingGroups
        .map((group, gi) => ({
          ...group,
          items: group.items
            .map((item, ii) => ({ item, key: `grouped-${gi}-${ii}` }))
            .filter(({ key }) => !dismissed.has(key)),
        }))
        .filter((group) => group.items.length > 0),
    [shoppingGroups, dismissed],
  )

  const visibleFlatItems = useMemo(
    () =>
      flatItems
        .map((item, ii) => ({ item, key: `flat-${ii}-${item}` }))
        .filter(({ key }) => !dismissed.has(key)),
    [flatItems, dismissed],
  )

  const hasPlannedRecipes = shoppingGroups.length > 0
  const hasVisibleItems =
    shoppingView === 'grouped' ? visibleGroups.length > 0 : visibleFlatItems.length > 0

  function toggleChecked(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function dismissItem(key: string) {
    setDismissed((prev) => new Set(prev).add(key))
  }

  function clearShoppingList() {
    const keys =
      shoppingView === 'grouped'
        ? shoppingGroups.flatMap((group, gi) => group.items.map((_, ii) => `grouped-${gi}-${ii}`))
        : flatItems.map((item, ii) => `flat-${ii}-${item}`)
    setDismissed((prev) => new Set([...prev, ...keys]))
  }

  return (
    <div className="flex flex-col gap-6">
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
          {shoppingGroups.length > 0 && (
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
          <p className="text-text-muted text-sm">Noch keine Rezepte für diese Woche geplant.</p>
        ) : !hasVisibleItems ? (
          <p className="text-text-muted text-sm">Einkauf erledigt — nichts mehr auf der Liste. 🎉</p>
        ) : shoppingView === 'grouped' ? (
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-4">
            {visibleGroups.map((group, gi) => (
              <div key={gi}>
                <div className="text-xs font-mono uppercase tracking-wide text-text-muted mb-1.5">
                  {group.recipeTitle}
                  {group.count > 1 && ` · ${group.count}×`}
                </div>
                <ul className="flex flex-col gap-1">
                  {group.items.map(({ item, key }) => {
                    const isChecked = checked.has(key)
                    return (
                      <li key={key} className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleChecked(key)}
                            className="accent-[var(--primary)]"
                          />
                          <span className={isChecked ? 'line-through text-text-muted' : ''}>{item}</span>
                        </label>
                        <button
                          onClick={() => dismissItem(key)}
                          className="text-text-muted hover:text-danger text-xs px-1"
                          aria-label={`${item} aus Einkaufsliste entfernen`}
                        >
                          ✕
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <ul className="flex flex-col gap-1">
              {visibleFlatItems.map(({ item, key }) => {
                const isChecked = checked.has(key)
                return (
                  <li key={key} className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChecked(key)}
                        className="accent-[var(--primary)]"
                      />
                      <span className={isChecked ? 'line-through text-text-muted' : ''}>{item}</span>
                    </label>
                    <button
                      onClick={() => dismissItem(key)}
                      className="text-text-muted hover:text-danger text-xs px-1"
                      aria-label={`${item} aus Einkaufsliste entfernen`}
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {hasVisibleItems && (
          <button
            onClick={clearShoppingList}
            className="w-full mt-3 border border-border rounded-xl py-2.5 text-sm text-text-muted hover:text-text"
          >
            Einkauf erledigt
          </button>
        )}
      </div>
    </div>
  )
}
