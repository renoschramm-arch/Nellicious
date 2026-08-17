import { useState, type FormEvent } from 'react'
import { useProfile } from '../lib/useProfile'
import { useWeightLogs, formatWeightKg, parseWeightKg } from '../lib/useWeightLogs'
import { useWaterLog } from '../lib/useWaterLog'
import { addDays, formatWeekdayShort, toISODate } from '../lib/week'
import { WeekBarChart } from '../components/WeekBarChart'
import { PageFlatlay } from '../components/PageFlatlay'

const DEFAULT_WATER_STEPS = [150, 250, 500]

function lastSevenDays(): Date[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
}

export function VerlaufPage() {
  const { profile, updateProfile } = useProfile()
  const { logs: weightLogs, upsertWeight, deleteWeight } = useWeightLogs()
  const { logs: waterLogs, todayMl, addWater, resetWater } = useWaterLog()

  const today = toISODate(new Date())
  const [weightDate, setWeightDate] = useState(today)
  const [weightValue, setWeightValue] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [customWater, setCustomWater] = useState('')
  const [editingSteps, setEditingSteps] = useState(false)
  const [stepInputs, setStepInputs] = useState<string[]>([])

  const latestWeight = weightLogs[0]
  const waterGoal = profile?.daily_water_goal_ml ?? 2500
  const waterPct = Math.min(100, Math.round((todayMl / waterGoal) * 100))
  const waterSteps = profile?.water_quick_amounts_ml ?? DEFAULT_WATER_STEPS
  const targetWeightKg = profile?.target_weight_kg ?? null
  const weightDiffKg = targetWeightKg != null && latestWeight
    ? Math.abs(Number(latestWeight.weight_kg) - targetWeightKg)
    : 0

  const days = lastSevenDays()
  const weightChartData = days.map((d) => {
    const iso = toISODate(d)
    const entry = weightLogs.find((log) => log.log_date === iso)
    const value = entry ? Number(entry.weight_kg) : null
    return { label: formatWeekdayShort(d), value, display: value != null ? formatWeightKg(value) : undefined }
  })
  const waterChartData = days.map((d) => {
    const iso = toISODate(d)
    const entry = waterLogs.find((log) => log.log_date === iso)
    return { label: formatWeekdayShort(d), value: entry ? entry.amount_ml : null }
  })

  async function handleWeightSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseWeightKg(weightValue)
    if (parsed == null) return
    await upsertWeight(weightDate, parsed)
    setWeightValue('')
  }

  async function handleCustomWaterSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(customWater)
    if (!amount || amount <= 0) return
    await addWater(Math.round(amount))
    setCustomWater('')
  }

  async function handleGoalSubmit(e: FormEvent) {
    e.preventDefault()
    if (!goalInput) return
    await updateProfile({ daily_water_goal_ml: Number(goalInput) })
    setEditingGoal(false)
  }

  function startEditingSteps() {
    setStepInputs(waterSteps.map(String))
    setEditingSteps(true)
  }

  async function handleStepsSubmit(e: FormEvent) {
    e.preventDefault()
    const next = stepInputs.map(Number)
    if (next.length !== 3 || next.some((n) => !n || n <= 0)) return
    await updateProfile({ water_quick_amounts_ml: next })
    setEditingSteps(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="auth.png" />
      <h1 className="font-display font-bold text-2xl">Verlauf</h1>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">💧 Wasser</h2>
          <span className="font-mono text-sm">
            {todayMl} <span className="text-text-muted">/ {waterGoal} ml</span>
          </span>
        </div>

        {editingGoal ? (
          <form onSubmit={handleGoalSubmit} className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={50}
              autoFocus
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Ziel in ml"
              className="w-28 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono outline-none focus:border-primary"
            />
            <button type="submit" className="text-sm font-medium text-primary">
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setEditingGoal(false)}
              className="text-sm text-text-muted"
            >
              Abbrechen
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Ziel: {waterGoal} ml</span>
            <button
              type="button"
              onClick={() => {
                setGoalInput(String(waterGoal))
                setEditingGoal(true)
              }}
              className="inline-flex items-center gap-1 bg-surface-2 border border-border rounded-full px-3 py-1.5 text-xs font-medium hover:border-primary transition-colors"
            >
              ✎ Anpassen
            </button>
          </div>
        )}

        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-honey rounded-full" style={{ width: `${waterPct}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Schnellauswahl</span>
          {!editingSteps && (
            <button
              type="button"
              onClick={startEditingSteps}
              className="inline-flex items-center gap-1 bg-surface-2 border border-border rounded-full px-3 py-1.5 text-xs font-medium hover:border-primary transition-colors"
            >
              ✎ Anpassen
            </button>
          )}
        </div>

        {editingSteps ? (
          <form onSubmit={handleStepsSubmit} className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {stepInputs.map((value, i) => (
                <input
                  key={i}
                  type="number"
                  min={1}
                  autoFocus={i === 0}
                  value={value}
                  onChange={(e) =>
                    setStepInputs((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono text-center outline-none focus:border-primary"
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingSteps(false)}
                className="text-sm text-text-muted"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="bg-primary text-on-primary font-semibold rounded-full px-4 py-1.5 text-sm"
              >
                Fertig
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {waterSteps.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => addWater(amount)}
                className="bg-surface-2 border border-border rounded-xl py-2 text-sm font-medium hover:border-primary transition-colors"
              >
                +{amount}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleCustomWaterSubmit} className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={customWater}
            onChange={(e) => setCustomWater(e.target.value)}
            placeholder="Eigene Menge in ml"
            className="flex-1 min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm font-medium hover:border-primary transition-colors"
          >
            + Hinzufügen
          </button>
        </form>

        <button
          type="button"
          onClick={() => resetWater()}
          className="text-xs text-text-muted w-fit"
        >
          ↺ Zurücksetzen
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="font-display font-semibold text-lg">⚖️ Gewicht</h2>
        {latestWeight && (
          <span className="font-mono text-2xl">
            {formatWeightKg(Number(latestWeight.weight_kg))} <span className="text-text-muted text-base">kg</span>
          </span>
        )}
        {latestWeight && targetWeightKg != null && (
          <span className="text-xs text-text-muted -mt-2">
            {weightDiffKg <= 0.05
              ? 'Wunschgewicht erreicht 🎉'
              : `Noch ${formatWeightKg(weightDiffKg)} kg bis ${formatWeightKg(targetWeightKg)} kg Wunschgewicht`}
          </span>
        )}
        <form onSubmit={handleWeightSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Datum
              <input
                type="date"
                value={weightDate}
                max={today}
                onChange={(e) => setWeightDate(e.target.value)}
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Gewicht (kg)
              <input
                type="text"
                inputMode="decimal"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                placeholder="z. B. 75,5"
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono outline-none focus:border-primary"
              />
            </label>
          </div>
          <button
            type="submit"
            className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
          >
            Eintragen
          </button>
        </form>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-text-muted">Wasser – letzte 7 Tage</span>
        <WeekBarChart data={waterChartData} color="var(--color-honey)" />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-text-muted">Gewicht – letzte 7 Tage</span>
        <WeekBarChart data={weightChartData} color="var(--color-basil)" />
      </div>

      {weightLogs.length > 0 && (
        <details className="bg-surface border border-border rounded-2xl p-4">
          <summary className="text-sm font-semibold cursor-pointer">Verlauf verwalten</summary>
          <div className="flex flex-col gap-1.5 mt-3">
            {weightLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-2 bg-surface-2 rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-text-muted">{log.log_date}</span>
                <span className="font-mono">{formatWeightKg(Number(log.weight_kg))} kg</span>
                <button
                  type="button"
                  onClick={() => deleteWeight(log.id)}
                  aria-label="Eintrag löschen"
                  className="text-text-muted hover:text-danger"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
