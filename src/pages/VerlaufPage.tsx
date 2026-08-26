import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import { useWeightLogs, formatWeightKg, parseWeightKg } from '../lib/useWeightLogs'
import { useWaterLog } from '../lib/useWaterLog'
import { useMealLogHistory } from '../lib/useMealLogs'
import {
  useFasting,
  fastingProtocolLabel,
  isOmad,
  formatCountdownHM,
  formatClockTime,
  toDatetimeLocalValue,
  getFastingPhase,
  type FastingSession,
} from '../lib/useFasting'
import { usePremium } from '../lib/usePremium'
import {
  EXPORT_RANGES,
  exportRangeLabel,
  fetchExportData,
  downloadMealLogsCSV,
  downloadWeightLogsCSV,
  generatePDFReport,
  type ExportRangeDays,
} from '../lib/exportReport'
import { addDays, formatWeekdayShort, toISODate } from '../lib/week'
import { WeekBarChart } from '../components/WeekBarChart'
import { PageFlatlay } from '../components/PageFlatlay'
import { PremiumModal } from '../components/PremiumModal'
import { FastingPhaseModal } from '../components/FastingPhaseModal'

const DEFAULT_WATER_STEPS = [150, 250, 500]
const DEFAULT_FASTING_PROTOCOLS = [16, 18, 20, 23]

function lastSevenDays(): Date[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
}

export function VerlaufPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const { logs: weightLogs, upsertWeight, deleteWeight } = useWeightLogs()
  const { logs: waterLogs, todayMl, addWater, resetWater } = useWaterLog()
  const { logs: nutritionLogs } = useMealLogHistory(7)
  const {
    activeSession,
    sessions: fastingSessions,
    start: startFasting,
    stop: stopFasting,
    updateSession: updateFastingSession,
    deleteSession: deleteFastingSession,
    streak: fastingStreak,
    now: fastingNow,
    eatingWindow,
    error: fastingError,
  } = useFasting()
  const { hasPremium } = usePremium()

  const today = toISODate(new Date())
  const [weightDate, setWeightDate] = useState(today)
  const [weightValue, setWeightValue] = useState('')
  const [editingWaterSettings, setEditingWaterSettings] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [customWater, setCustomWater] = useState('')
  const [stepInputs, setStepInputs] = useState<string[]>([])
  const [fastingTargetHours, setFastingTargetHours] = useState(16)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [editingFastingSettings, setEditingFastingSettings] = useState(false)
  const [fastingProtocolInputs, setFastingProtocolInputs] = useState<string[]>([])
  const [fastingEnabledInput, setFastingEnabledInput] = useState(true)
  const [customStartOpen, setCustomStartOpen] = useState(false)
  const [customStartValue, setCustomStartValue] = useState('')
  const [customEndOpen, setCustomEndOpen] = useState(false)
  const [customEndValue, setCustomEndValue] = useState('')
  const [customTargetOpen, setCustomTargetOpen] = useState(false)
  const [customTargetValue, setCustomTargetValue] = useState('')
  const [sessionEditMenuOpen, setSessionEditMenuOpen] = useState(false)
  const [showFastingPhaseModal, setShowFastingPhaseModal] = useState(false)
  const [exportRangeDays, setExportRangeDays] = useState<ExportRangeDays>(30)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (profile?.fasting_default_hours) setFastingTargetHours(profile.fasting_default_hours)
  }, [profile?.fasting_default_hours])

  // Menü wieder einklappen, sobald keine aktive Session mehr läuft — sonst
  // stünde es beim nächsten Fasten-Start ungewollt schon offen.
  useEffect(() => {
    if (!activeSession) setSessionEditMenuOpen(false)
  }, [activeSession])

  const latestWeight = weightLogs[0]
  const waterGoal = profile?.daily_water_goal_ml ?? 2500
  const waterPct = Math.min(100, Math.round((todayMl / waterGoal) * 100))
  const waterSteps = profile?.water_quick_amounts_ml ?? DEFAULT_WATER_STEPS
  const fastingProtocols = profile?.fasting_protocol_hours ?? DEFAULT_FASTING_PROTOCOLS
  const fastingEnabled = profile?.fasting_enabled ?? true
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

  const fastingElapsedMs = activeSession ? fastingNow - new Date(activeSession.started_at).getTime() : 0
  const fastingTargetMs = (activeSession?.target_hours ?? fastingTargetHours) * 3_600_000
  const fastingPct = activeSession ? Math.min(100, Math.round((fastingElapsedMs / fastingTargetMs) * 100)) : 0
  const fastingElapsedHours = activeSession ? fastingElapsedMs / 3_600_000 : null
  const currentFastingPhase = fastingElapsedHours != null ? getFastingPhase(t, fastingElapsedHours) : null
  const fastingEndsAt = activeSession
    ? new Date(new Date(activeSession.started_at).getTime() + activeSession.target_hours * 3_600_000)
    : null
  const fastingRemainingMs = fastingEndsAt ? fastingEndsAt.getTime() - fastingNow : 0
  const eatingWindowPct = eatingWindow
    ? Math.min(100, Math.round(((eatingWindow.totalMs - eatingWindow.remainingMs) / eatingWindow.totalMs) * 100))
    : 0
  const ringPct = activeSession ? fastingPct : eatingWindowPct
  const ringColor = !activeSession && eatingWindow ? 'var(--honey)' : 'var(--basil)'

  const fastingChartData = days.map((d) => {
    const iso = toISODate(d)
    const hours = fastingSessions
      .filter((s) => toISODate(new Date(s.started_at)) === iso)
      .reduce((sum, s) => {
        const end = s.ended_at ? new Date(s.ended_at).getTime() : fastingNow
        return sum + (end - new Date(s.started_at).getTime()) / 3_600_000
      }, 0)
    const rounded = Math.round(hours * 10) / 10
    return { label: formatWeekdayShort(d), value: rounded > 0 ? rounded : null, display: rounded > 0 ? `${rounded}h` : undefined }
  })

  const nutritionByDay = useMemo(() => {
    const map = new Map<string, { kcal: number; protein_g: number; carbs_g: number; fat_g: number }>()
    for (const log of nutritionLogs) {
      const iso = toISODate(new Date(log.logged_at))
      const totals = map.get(iso) ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      totals.kcal += log.kcal
      totals.protein_g += log.protein_g
      totals.carbs_g += log.carbs_g
      totals.fat_g += log.fat_g
      map.set(iso, totals)
    }
    return map
  }, [nutritionLogs])

  const kcalChartData = days.map((d) => {
    const iso = toISODate(d)
    const totals = nutritionByDay.get(iso)
    return { label: formatWeekdayShort(d), value: totals ? totals.kcal : null }
  })

  // Ø pro Tag über die volle Woche gerechnet (nicht nur über Tage mit
  // Einträgen), damit die Zahl den tatsächlichen Wochendurchschnitt zeigt.
  const weekMacroAvg = useMemo(() => {
    const sum = nutritionLogs.reduce(
      (acc, l) => ({
        protein_g: acc.protein_g + l.protein_g,
        carbs_g: acc.carbs_g + l.carbs_g,
        fat_g: acc.fat_g + l.fat_g,
      }),
      { protein_g: 0, carbs_g: 0, fat_g: 0 },
    )
    return {
      protein_g: Math.round(sum.protein_g / 7),
      carbs_g: Math.round(sum.carbs_g / 7),
      fat_g: Math.round(sum.fat_g / 7),
    }
  }, [nutritionLogs])

  async function handleFastingStart() {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    await startFasting(fastingTargetHours)
    if (fastingTargetHours !== profile?.fasting_default_hours) {
      await updateProfile({ fasting_default_hours: fastingTargetHours })
    }
  }

  function openCustomStart() {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    setEditingFastingSettings(false)
    setCustomStartValue(toDatetimeLocalValue(new Date()))
    setCustomStartOpen(true)
  }

  async function handleCustomStartSubmit(e: FormEvent) {
    e.preventDefault()
    const date = new Date(customStartValue)
    if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) return
    await startFasting(fastingTargetHours, date)
    if (fastingTargetHours !== profile?.fasting_default_hours) {
      await updateProfile({ fasting_default_hours: fastingTargetHours })
    }
    setCustomStartOpen(false)
  }

  function openCustomEnd() {
    setEditingFastingSettings(false)
    setCustomEndValue(toDatetimeLocalValue(new Date()))
    setCustomEndOpen(true)
  }

  async function handleCustomEndSubmit(e: FormEvent) {
    e.preventDefault()
    if (!activeSession) return
    const date = new Date(customEndValue)
    const startMs = new Date(activeSession.started_at).getTime()
    if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() || date.getTime() <= startMs) return
    await stopFasting(date)
    setCustomEndOpen(false)
  }

  function openCustomTarget() {
    if (!activeSession) return
    setCustomTargetValue(String(activeSession.target_hours))
    setCustomTargetOpen(true)
  }

  async function handleCustomTargetSubmit(e: FormEvent) {
    e.preventDefault()
    if (!activeSession) return
    const hours = Number(customTargetValue)
    if (!Number.isFinite(hours) || hours <= 0 || hours >= 24) return
    await updateFastingSession(activeSession.id, { target_hours: hours })
    setCustomTargetOpen(false)
  }

  async function handleFastingSessionEditSubmit(e: FormEvent<HTMLFormElement>, session: FastingSession) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const startedRaw = formData.get('started_at') as string | null
    if (!startedRaw) return
    const startedAt = new Date(startedRaw)
    if (Number.isNaN(startedAt.getTime()) || startedAt.getTime() > Date.now()) return

    const targetRaw = formData.get('target_hours') as string | null
    const targetHours = targetRaw ? Number(targetRaw) : NaN
    if (!Number.isFinite(targetHours) || targetHours <= 0 || targetHours >= 24) return

    if (session.ended_at) {
      const endedRaw = formData.get('ended_at') as string | null
      if (!endedRaw) return
      const endedAt = new Date(endedRaw)
      if (Number.isNaN(endedAt.getTime()) || endedAt.getTime() > Date.now() || endedAt.getTime() <= startedAt.getTime()) {
        return
      }
      await updateFastingSession(session.id, { started_at: startedAt, ended_at: endedAt, target_hours: targetHours })
    } else {
      await updateFastingSession(session.id, { started_at: startedAt, target_hours: targetHours })
    }
  }

  function startEditingFastingSettings() {
    setCustomStartOpen(false)
    setCustomEndOpen(false)
    setFastingProtocolInputs(fastingProtocols.map(String))
    setFastingEnabledInput(fastingEnabled)
    setEditingFastingSettings(true)
  }

  async function handleFastingSettingsSubmit(e: FormEvent) {
    e.preventDefault()
    const nextProtocols = fastingProtocolInputs.map(Number)
    const patch: { fasting_protocol_hours?: number[]; fasting_enabled?: boolean } = {}
    if (nextProtocols.length === 4 && nextProtocols.every((n) => n > 0 && n < 24)) {
      patch.fasting_protocol_hours = nextProtocols
    }
    // Ausschalten nur möglich, solange gerade nicht gefastet wird.
    if (!activeSession) patch.fasting_enabled = fastingEnabledInput
    if (Object.keys(patch).length > 0) await updateProfile(patch)
    if (patch.fasting_protocol_hours && !patch.fasting_protocol_hours.includes(fastingTargetHours)) {
      setFastingTargetHours(patch.fasting_protocol_hours[0])
    }
    setEditingFastingSettings(false)
  }

  async function handleQuickEnableFasting() {
    await updateProfile({ fasting_enabled: true })
  }

  async function handleExport(format: 'pdf' | 'csv-meals' | 'csv-weight') {
    if (!hasPremium) {
      setShowPremiumModal(true)
      return
    }
    if (!user) return
    setExporting(true)
    try {
      const { mealLogs, weightLogs } = await fetchExportData(user.id, exportRangeDays)
      if (format === 'csv-meals') {
        downloadMealLogsCSV(mealLogs)
      } else if (format === 'csv-weight') {
        downloadWeightLogsCSV(weightLogs)
      } else {
        const rangeLabel = exportRangeLabel(exportRangeDays)
        const doc = generatePDFReport({ mealLogs, weightLogs, rangeLabel, userEmail: user.email ?? '' })
        doc.save('nellicious-bericht.pdf')
      }
    } finally {
      setExporting(false)
    }
  }

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

  function startEditingWaterSettings() {
    setGoalInput(String(waterGoal))
    setStepInputs(waterSteps.map(String))
    setEditingWaterSettings(true)
  }

  async function handleWaterSettingsSubmit(e: FormEvent) {
    e.preventDefault()
    const nextGoal = Number(goalInput)
    const nextSteps = stepInputs.map(Number)
    const patch: { daily_water_goal_ml?: number; water_quick_amounts_ml?: number[] } = {}
    if (nextGoal > 0) patch.daily_water_goal_ml = nextGoal
    if (nextSteps.length === 3 && nextSteps.every((n) => n > 0)) patch.water_quick_amounts_ml = nextSteps
    if (Object.keys(patch).length > 0) await updateProfile(patch)
    setEditingWaterSettings(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageFlatlay file="auth.png" />
      <h1 className="font-display font-bold text-2xl">{t('verlauf.title')}</h1>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            {t('verlauf.waterTitle')}
            <button
              type="button"
              onClick={startEditingWaterSettings}
              aria-label={t('verlauf.waterSettingsAria')}
              className="w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-full bg-surface-2 border border-border text-xs text-text-muted hover:border-primary hover:text-text transition-colors"
            >
              ✎
            </button>
          </h2>
          <span className="font-mono text-sm">
            {todayMl} <span className="text-text-muted">/ {waterGoal} ml</span>
          </span>
        </div>

        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-honey rounded-full" style={{ width: `${waterPct}%` }} />
        </div>

        {editingWaterSettings ? (
          <form
            onSubmit={handleWaterSettingsSubmit}
            className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-2.5"
          >
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t('verlauf.goalMl')}
              <input
                type="number"
                min={0}
                step={50}
                autoFocus
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t('verlauf.quickSelectMl')}
              <div className="grid grid-cols-3 gap-2">
                {stepInputs.map((value, i) => (
                  <input
                    key={i}
                    type="number"
                    min={1}
                    value={value}
                    onChange={(e) =>
                      setStepInputs((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono text-center outline-none focus:border-primary"
                  />
                ))}
              </div>
            </label>
            <div className="flex items-center justify-end gap-3 mt-0.5">
              <button
                type="button"
                onClick={() => setEditingWaterSettings(false)}
                className="text-sm text-text-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="bg-primary text-on-primary font-semibold rounded-full px-4 py-1.5 text-sm"
              >
                {t('common.save')}
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
            placeholder={t('verlauf.customAmountPlaceholder')}
            className="flex-1 min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="shrink-0 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm font-medium hover:border-primary transition-colors"
          >
            {t('verlauf.addButton')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('verlauf.confirmResetWater'))) resetWater()
            }}
            aria-label={t('verlauf.resetWaterAria')}
            className="shrink-0 w-[38px] h-[38px] inline-flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text-muted hover:border-primary hover:text-text transition-colors"
          >
            ↺
          </button>
        </form>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="font-display font-semibold text-lg">{t('verlauf.weightTitle')}</h2>
        {latestWeight && (
          <span className="font-mono text-2xl">
            {formatWeightKg(Number(latestWeight.weight_kg))} <span className="text-text-muted text-base">kg</span>
          </span>
        )}
        {latestWeight && targetWeightKg != null && (
          <span className="text-xs text-text-muted -mt-2">
            {weightDiffKg <= 0.05
              ? t('verlauf.targetReached')
              : t('verlauf.targetRemaining', {
                  diff: formatWeightKg(weightDiffKg),
                  target: formatWeightKg(targetWeightKg),
                })}
          </span>
        )}
        <form onSubmit={handleWeightSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t('verlauf.date')}
              <input
                type="date"
                value={weightDate}
                max={today}
                onChange={(e) => setWeightDate(e.target.value)}
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t('verlauf.weightKg')}
              <input
                type="text"
                inputMode="decimal"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                placeholder={t('verlauf.weightPlaceholder')}
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono outline-none focus:border-primary"
              />
            </label>
          </div>
          <button
            type="submit"
            className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
          >
            {t('verlauf.logButton')}
          </button>
        </form>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            {t('verlauf.fastingTitle')}{!hasPremium && ' 🔒'}
            <button
              type="button"
              onClick={startEditingFastingSettings}
              aria-label={t('verlauf.adjustProtocolsAria')}
              className="w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-full bg-surface-2 border border-border text-xs text-text-muted hover:border-primary hover:text-text transition-colors"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => setShowFastingPhaseModal(true)}
              aria-label={t('verlauf.fastingInfoAria')}
              className="w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-full bg-surface-2 border border-border text-xs text-text-muted hover:border-primary hover:text-text transition-colors"
            >
              ℹ️
            </button>
          </h2>
          {fastingStreak > 0 && (
            <span className="font-mono text-xs text-honey">{t('verlauf.fastingStreak', { count: fastingStreak })}</span>
          )}
        </div>

        {fastingEnabled && (
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `conic-gradient(${ringColor} 0deg ${(ringPct / 100) * 360}deg, var(--border) ${(ringPct / 100) * 360}deg 360deg)`,
              }}
            >
              <div className="w-10 h-10 rounded-full bg-surface" />
            </div>
            <div className="text-sm flex-1">
              {activeSession && fastingEndsAt ? (
                <>
                  {fastingRemainingMs > 0 ? t('verlauf.endsIn') : t('verlauf.goalReached')}
                  <span className="block font-mono font-medium text-base text-basil">
                    {fastingRemainingMs > 0 ? (
                      <>
                        {formatCountdownHM(fastingRemainingMs)} h{' '}
                        <span className="text-text-muted">{t('verlauf.atTime', { time: formatClockTime(fastingEndsAt) })}</span>
                      </>
                    ) : (
                      <>
                        +{formatCountdownHM(-fastingRemainingMs)} h{' '}
                        <span className="text-text-muted">{t('verlauf.sinceTime', { time: formatClockTime(fastingEndsAt) })}</span>
                      </>
                    )}
                  </span>
                  {currentFastingPhase && (
                    <span className="block text-text-muted text-xs mt-0.5">
                      {t('verlauf.phaseLabel', { title: currentFastingPhase.title })}
                    </span>
                  )}
                </>
              ) : eatingWindow ? (
                <>
                  {eatingWindow.remainingMs > 0 ? t('verlauf.eatingBeginsIn') : t('verlauf.eatingWindowExceeded')}
                  <span className="block font-mono font-medium text-base text-honey">
                    {eatingWindow.remainingMs > 0 ? (
                      <>
                        {formatCountdownHM(eatingWindow.remainingMs)} h{' '}
                        <span className="text-text-muted">
                          {t('verlauf.atTime', { time: formatClockTime(new Date(eatingWindow.endsAt)) })}
                        </span>
                      </>
                    ) : (
                      <>
                        +{formatCountdownHM(-eatingWindow.remainingMs)} h{' '}
                        <span className="text-text-muted">
                          {t('verlauf.sinceTime', { time: formatClockTime(new Date(eatingWindow.endsAt)) })}
                        </span>
                      </>
                    )}
                  </span>
                </>
              ) : (
                <>
                  {t('verlauf.readyToFast')}
                  <span className="block text-text-muted text-xs mt-0.5">{t('verlauf.chooseProtocolHint')}</span>
                </>
              )}
            </div>
          </div>
        )}

        {editingFastingSettings ? (
          <form
            onSubmit={handleFastingSettingsSubmit}
            className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-2.5"
          >
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="flex flex-col">
                {t('verlauf.fastingEnabledLabel')}
                {activeSession && (
                  <span className="text-xs text-text-muted">{t('verlauf.disableHint')}</span>
                )}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={fastingEnabledInput}
                disabled={!!activeSession}
                onClick={() => setFastingEnabledInput((v) => !v)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  fastingEnabledInput ? 'bg-basil' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    fastingEnabledInput ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t('verlauf.protocolsLabel')}
              <div className="grid grid-cols-4 gap-2">
                {fastingProtocolInputs.map((value, i) => (
                  <input
                    key={i}
                    type="number"
                    min={1}
                    max={23}
                    value={value}
                    onChange={(e) =>
                      setFastingProtocolInputs((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono text-center outline-none focus:border-primary"
                  />
                ))}
              </div>
            </label>
            <div className="flex items-center justify-end gap-3 mt-0.5">
              <button
                type="button"
                onClick={() => setEditingFastingSettings(false)}
                className="text-sm text-text-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="bg-primary text-on-primary font-semibold rounded-full px-4 py-1.5 text-sm"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        ) : !fastingEnabled ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-text-muted">{t('verlauf.fastingDisabledText')}</span>
            <button
              type="button"
              onClick={handleQuickEnableFasting}
              className="text-sm text-primary font-medium shrink-0"
            >
              {t('verlauf.enableButton')}
            </button>
          </div>
        ) : (
          !activeSession && (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-4 gap-2">
                {fastingProtocols.map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setFastingTargetHours(hours)}
                    className={`rounded-xl py-2 text-sm font-medium transition-colors ${
                      fastingTargetHours === hours
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-2 border border-border hover:border-primary'
                    }`}
                  >
                    {fastingProtocolLabel(hours)}
                  </button>
                ))}
              </div>
              {isOmad(fastingTargetHours) && (
                <span className="text-xs text-text-muted">
                  {t('verlauf.omadHint', { protocol: fastingProtocolLabel(fastingTargetHours) })}
                </span>
              )}
            </div>
          )
        )}

        {fastingError && (
          <p className="text-xs text-danger">{t('verlauf.saveError', { error: fastingError })}</p>
        )}

        {fastingEnabled && (customTargetOpen ? (
          <form
            onSubmit={handleCustomTargetSubmit}
            className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-2.5"
          >
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t('verlauf.customTargetLabel')}
              <input
                type="number"
                min={1}
                max={23}
                autoFocus
                value={customTargetValue}
                onChange={(e) => setCustomTargetValue(e.target.value)}
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono outline-none focus:border-primary"
              />
            </label>
            <div className="flex items-center justify-end gap-3 mt-0.5">
              <button
                type="button"
                onClick={() => setCustomTargetOpen(false)}
                className="text-sm text-text-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="bg-primary text-on-primary font-semibold rounded-full px-4 py-1.5 text-sm"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        ) : customStartOpen || customEndOpen ? (
          <form
            onSubmit={activeSession ? handleCustomEndSubmit : handleCustomStartSubmit}
            className="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-2.5"
          >
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {activeSession ? t('verlauf.endedAtLabel') : t('verlauf.startedAtLabel')}
              <input
                type="datetime-local"
                autoFocus
                max={toDatetimeLocalValue(new Date())}
                min={activeSession ? toDatetimeLocalValue(new Date(activeSession.started_at)) : undefined}
                value={activeSession ? customEndValue : customStartValue}
                onChange={(e) =>
                  activeSession ? setCustomEndValue(e.target.value) : setCustomStartValue(e.target.value)
                }
                className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-mono outline-none focus:border-primary"
              />
            </label>
            <div className="flex items-center justify-end gap-3 mt-0.5">
              <button
                type="button"
                onClick={() => {
                  setCustomStartOpen(false)
                  setCustomEndOpen(false)
                }}
                className="text-sm text-text-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="bg-primary text-on-primary font-semibold rounded-full px-4 py-1.5 text-sm"
              >
                {activeSession ? t('verlauf.stopButton') : t('verlauf.startButton')}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => (activeSession ? stopFasting() : handleFastingStart())}
              className={`font-semibold rounded-xl py-3 text-sm ${
                activeSession
                  ? 'bg-surface-2 border border-border text-danger hover:bg-danger/10'
                  : 'bg-primary text-on-primary'
              }`}
            >
              {activeSession ? t('verlauf.stopFastingButton') : t('verlauf.startFastingButton')}
            </button>
            {activeSession ? (
              sessionEditMenuOpen ? (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSessionEditMenuOpen(false)
                      openCustomEnd()
                    }}
                    className="text-xs text-text-muted underline hover:text-text"
                  >
                    {t('verlauf.retroEnd')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionEditMenuOpen(false)
                      openCustomTarget()
                    }}
                    className="text-xs text-text-muted underline hover:text-text"
                  >
                    {t('verlauf.adjustGoal')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionEditMenuOpen(false)}
                    className="text-xs text-text-muted"
                    aria-label={t('common.cancel')}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setSessionEditMenuOpen(true)}
                    className="text-xs text-text-muted underline hover:text-text"
                  >
                    {t('verlauf.editSession')}
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={openCustomStart}
                  className="text-xs text-text-muted underline hover:text-text"
                >
                  {t('verlauf.retroStart')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm font-medium text-text-muted">{t('verlauf.kcalLast7')}</span>
        <WeekBarChart data={kcalChartData} color="var(--color-primary)" />
        <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1 border-t border-border">
          <div className="text-center pt-2">
            <div className="text-text-muted uppercase mb-0.5">{t('verlauf.avgProtein')}</div>
            {weekMacroAvg.protein_g} g
          </div>
          <div className="text-center pt-2">
            <div className="text-text-muted uppercase mb-0.5">{t('verlauf.avgCarbs')}</div>
            {weekMacroAvg.carbs_g} g
          </div>
          <div className="text-center pt-2">
            <div className="text-text-muted uppercase mb-0.5">{t('verlauf.avgFat')}</div>
            {weekMacroAvg.fat_g} g
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-text-muted">{t('verlauf.waterLast7')}</span>
        <WeekBarChart data={waterChartData} color="var(--color-honey)" />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-text-muted">{t('verlauf.weightLast7')}</span>
        <WeekBarChart data={weightChartData} color="var(--color-basil)" />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-text-muted">{t('verlauf.fastingLast7')}</span>
        <WeekBarChart data={fastingChartData} color="var(--color-basil)" />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="font-display font-semibold text-lg">{t('verlauf.exportTitle')}{!hasPremium && ' 🔒'}</h2>
        <div className="grid grid-cols-3 gap-2">
          {EXPORT_RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setExportRangeDays(range.days)}
              className={`rounded-xl py-2 text-xs font-medium transition-colors ${
                exportRangeDays === range.days
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-2 border border-border hover:border-primary'
              }`}
            >
              {exportRangeLabel(range.days)}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={exporting}
          onClick={() => handleExport('pdf')}
          className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
        >
          {t('verlauf.exportPdf')}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('csv-meals')}
            className="bg-surface-2 border border-border rounded-xl py-2.5 text-sm font-medium hover:border-primary transition-colors disabled:opacity-60"
          >
            {t('verlauf.exportCsvMeals')}
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('csv-weight')}
            className="bg-surface-2 border border-border rounded-xl py-2.5 text-sm font-medium hover:border-primary transition-colors disabled:opacity-60"
          >
            {t('verlauf.exportCsvWeight')}
          </button>
        </div>
      </div>

      {weightLogs.length > 0 && (
        <details className="bg-surface border border-border rounded-2xl p-4">
          <summary className="text-sm font-semibold cursor-pointer">{t('verlauf.manageHistory')}</summary>
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
                  aria-label={t('verlauf.deleteEntryAria')}
                  className="text-text-muted hover:text-danger"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {fastingSessions.length > 0 && (
        <details className="bg-surface border border-border rounded-2xl p-4">
          <summary className="text-sm font-semibold cursor-pointer">{t('verlauf.manageFastingHistory')}</summary>
          <div className="flex flex-col gap-2 mt-3">
            {fastingSessions.map((session) => (
              <form
                key={session.id}
                onSubmit={(e) => handleFastingSessionEditSubmit(e, session)}
                className="bg-surface-2 rounded-lg px-3 py-2.5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                  <span>{t('verlauf.protocolSuffix', { protocol: fastingProtocolLabel(session.target_hours) })}</span>
                  <button
                    type="button"
                    onClick={() => deleteFastingSession(session.id)}
                    aria-label={t('verlauf.deleteFastingEntryAria')}
                    className="text-text-muted hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
                <label className="flex flex-col gap-1 text-xs text-text-muted w-20">
                  {t('verlauf.targetHoursLabel')}
                  <input
                    type="number"
                    name="target_hours"
                    min={1}
                    max={23}
                    defaultValue={session.target_hours}
                    className="rounded-lg border border-border bg-bg px-2 py-1.5 text-xs font-mono outline-none focus:border-primary"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-xs text-text-muted">
                    {t('verlauf.start')}
                    <input
                      type="datetime-local"
                      name="started_at"
                      defaultValue={toDatetimeLocalValue(new Date(session.started_at))}
                      max={toDatetimeLocalValue(new Date())}
                      className="rounded-lg border border-border bg-bg px-2 py-1.5 text-xs font-mono outline-none focus:border-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-text-muted">
                    {t('verlauf.end')}
                    {session.ended_at ? (
                      <input
                        type="datetime-local"
                        name="ended_at"
                        defaultValue={toDatetimeLocalValue(new Date(session.ended_at))}
                        max={toDatetimeLocalValue(new Date())}
                        className="rounded-lg border border-border bg-bg px-2 py-1.5 text-xs font-mono outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="rounded-lg border border-border bg-bg px-2 py-1.5 text-xs text-text-muted">
                        {t('verlauf.stillRunning')}
                      </span>
                    )}
                  </label>
                </div>
                <button type="submit" className="self-end text-xs text-primary font-medium">
                  {t('common.save')}
                </button>
              </form>
            ))}
          </div>
        </details>
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
      {showFastingPhaseModal && (
        <FastingPhaseModal elapsedHours={fastingElapsedHours} onClose={() => setShowFastingPhaseModal(false)} />
      )}
    </div>
  )
}
