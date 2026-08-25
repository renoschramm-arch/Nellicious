import { useState } from 'react'
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '../lib/useRecipes'
import type { MealSlot } from '../lib/useMealPlan'
import type { AutoPlanSlot } from '../lib/autoPlan'
import { formatDayLabel } from '../lib/week'

export function AutoPlanModal({
  onRun,
  onClose,
}: {
  onRun: (slots: MealSlot[], overwrite: boolean) => Promise<AutoPlanSlot[]>
  onClose: () => void
}) {
  const [selectedSlots, setSelectedSlots] = useState<Set<MealSlot>>(new Set(MEAL_TYPES))
  const [overwrite, setOverwrite] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ filled: number; unfilled: AutoPlanSlot[] } | null>(null)

  function toggleSlot(slot: MealSlot) {
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  async function handleRun() {
    if (selectedSlots.size === 0) return
    setRunning(true)
    const slots = MEAL_TYPES.filter((s) => selectedSlots.has(s))
    const unfilled = await onRun(slots, overwrite)
    setResult({ filled: slots.length, unfilled })
    setRunning(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-lg">🪄 Woche automatisch planen</h2>
            <p className="text-xs text-text-muted">Passend zu deinem Ernährungstyp und Kalorienziel</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-text-muted hover:text-text text-sm" aria-label="Schließen">
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {!result ? (
            <>
              <div>
                <p className="text-xs font-mono uppercase tracking-wide text-text-muted mb-2">Mahlzeiten</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {MEAL_TYPES.map((slot) => {
                    const active = selectedSlots.has(slot)
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(slot)}
                        className={`rounded-lg py-2 text-[11px] font-medium transition-colors ${
                          active
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-2 border border-border text-text-muted hover:border-primary'
                        }`}
                      >
                        {MEAL_TYPE_LABELS[slot]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="w-5 h-5 shrink-0 accent-[var(--primary)]"
                />
                Bereits geplante Mahlzeiten überschreiben
              </label>

              <button
                type="button"
                onClick={handleRun}
                disabled={selectedSlots.size === 0 || running}
                className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
              >
                {running ? 'Plan wird erstellt …' : 'Plan erstellen'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm">
                {result.filled - result.unfilled.length > 0
                  ? `${result.filled - result.unfilled.length} Mahlzeit${result.filled - result.unfilled.length === 1 ? '' : 'en'} eingeplant.`
                  : 'Keine Mahlzeiten eingeplant.'}
              </p>
              {result.unfilled.length > 0 && (
                <div className="bg-honey/10 border border-honey/40 rounded-xl p-3 text-xs text-text-muted flex flex-col gap-1">
                  <span className="font-medium text-text">Für folgende Slots wurde kein passendes Rezept gefunden:</span>
                  <ul className="list-disc list-inside">
                    {result.unfilled.map((u) => (
                      <li key={`${u.date}-${u.slot}`}>
                        {formatDayLabel(new Date(`${u.date}T00:00:00`))} · {MEAL_TYPE_LABELS[u.slot]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
              >
                Fertig
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
