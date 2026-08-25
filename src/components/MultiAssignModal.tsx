import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MEAL_TYPES, getMealTypeLabels, localizeRecipeText, type Recipe } from '../lib/useRecipes'
import type { MealSlot } from '../lib/useMealPlan'
import { toISODate, formatWeekdayShort } from '../lib/week'

export interface Selection {
  date: string
  slot: MealSlot
}

export function MultiAssignModal({
  recipe,
  days,
  suggestedCount,
  occupiedTitleFor,
  onAssign,
  onClose,
}: {
  recipe: Recipe
  days: Date[]
  suggestedCount?: number
  occupiedTitleFor: (dateISO: string, slot: MealSlot) => string | undefined
  onAssign: (selections: Selection[]) => Promise<void>
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const mealTypeLabels = getMealTypeLabels(t)
  const localizedTitle = localizeRecipeText(recipe, i18n.language).title
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function applySuggestion() {
    if (!suggestedCount) return
    const next = new Set<string>()
    for (let i = 0; i < Math.min(suggestedCount, days.length); i++) {
      next.add(`${toISODate(days[i])}|${recipe.meal_type}`)
    }
    setSelected(next)
  }

  async function handleSubmit() {
    if (selected.size === 0) return
    setSaving(true)
    const selections: Selection[] = [...selected].map((key) => {
      const [date, slot] = key.split('|') as [string, MealSlot]
      return { date, slot }
    })
    await onAssign(selections)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-lg truncate">{localizedTitle}</h2>
            <p className="text-xs text-text-muted">{t('multiAssign.subtitle')}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-text-muted hover:text-text text-sm" aria-label={t('multiAssign.close')}>
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          {suggestedCount != null && suggestedCount > 0 && (
            <button
              type="button"
              onClick={applySuggestion}
              className="self-start text-xs text-primary font-medium underline"
            >
              {t('multiAssign.applySuggestion', {
                count: Math.min(suggestedCount, days.length),
                mealType: mealTypeLabels[recipe.meal_type],
              })}
            </button>
          )}

          <div className="flex flex-col gap-2">
            {days.map((day) => {
              const dateISO = toISODate(day)
              return (
                <div key={dateISO} className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-xs font-mono text-text-muted">{formatWeekdayShort(day)}</span>
                  <div className="grid grid-cols-4 gap-1.5 flex-1">
                    {MEAL_TYPES.map((slot) => {
                      const key = `${dateISO}|${slot}`
                      const occupiedTitle = occupiedTitleFor(dateISO, slot)
                      const active = selected.has(key)
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggle(key)}
                          title={occupiedTitle ? t('multiAssign.occupiedBy', { title: occupiedTitle }) : undefined}
                          className={`rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                            active
                              ? 'bg-primary text-on-primary'
                              : occupiedTitle
                                ? 'bg-honey/10 border border-honey/40 text-honey'
                                : 'bg-surface-2 border border-border text-text-muted hover:border-primary'
                          }`}
                        >
                          {mealTypeLabels[slot].slice(0, 2)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-text-muted">
            {t('multiAssign.slotsSelected', { count: selected.size })}
            {suggestedCount != null && suggestedCount > 0 && t('multiAssign.suggestionCount', { count: suggestedCount })}
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.size === 0 || saving}
            className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
          >
            {saving ? t('multiAssign.saving') : t('multiAssign.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
