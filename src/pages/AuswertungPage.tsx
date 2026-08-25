import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../lib/useProfile'
import { useMealLogHistory } from '../lib/useMealLogs'
import { useWeightLogHistory, formatWeightKg } from '../lib/useWeightLogs'
import { useFastingHistory } from '../lib/useFasting'
import { usePremium } from '../lib/usePremium'
import { TREND_RANGES, bucketDailyAverage, longestStreak, type TrendRangeDays } from '../lib/trendBuckets'
import { toISODate } from '../lib/week'
import { WeekBarChart } from '../components/WeekBarChart'
import { WeightTrendChart } from '../components/WeightTrendChart'
import { PremiumModal } from '../components/PremiumModal'
import { getIntlLocale } from '../lib/i18n'

export function AuswertungPage() {
  const { hasPremium } = usePremium()
  const { profile } = useProfile()
  const [rangeDays, setRangeDays] = useState<TrendRangeDays>(90)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const range = TREND_RANGES.find((r) => r.days === rangeDays) ?? TREND_RANGES[1]

  const { logs: mealLogs } = useMealLogHistory(rangeDays)
  const { logs: weightLogs } = useWeightLogHistory(rangeDays)
  const { sessions: fastingSessions } = useFastingHistory(rangeDays)

  const kcalGoal = profile?.daily_kcal_goal ?? 2000
  const proteinGoal = profile?.daily_protein_goal ?? 0
  const carbsGoal = profile?.daily_carbs_goal ?? 0
  const fatGoal = profile?.daily_fat_goal ?? 0

  const dailyTotals = useMemo(() => {
    const map = new Map<string, { kcal: number; protein: number; carbs: number; fat: number }>()
    for (const log of mealLogs) {
      const iso = toISODate(new Date(log.logged_at))
      const cur = map.get(iso) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      cur.kcal += log.kcal
      cur.protein += log.protein_g
      cur.carbs += log.carbs_g
      cur.fat += log.fat_g
      map.set(iso, cur)
    }
    return map
  }, [mealLogs])

  const loggedDayCount = dailyTotals.size
  const sums = useMemo(() => {
    let kcal = 0
    let protein = 0
    let carbs = 0
    let fat = 0
    let hitDays = 0
    for (const t of dailyTotals.values()) {
      kcal += t.kcal
      protein += t.protein
      carbs += t.carbs
      fat += t.fat
      if (t.kcal >= kcalGoal * 0.9 && t.kcal <= kcalGoal * 1.1) hitDays++
    }
    return { kcal, protein, carbs, fat, hitDays }
  }, [dailyTotals, kcalGoal])

  const avgKcal = Math.round(sums.kcal / rangeDays)
  const avgProtein = Math.round(sums.protein / rangeDays)
  const avgCarbs = Math.round(sums.carbs / rangeDays)
  const avgFat = Math.round(sums.fat / rangeDays)
  const kcalGoalDeltaPct = kcalGoal > 0 ? Math.round(((avgKcal - kcalGoal) / kcalGoal) * 100) : 0
  const hitRate = loggedDayCount > 0 ? Math.round((sums.hitDays / loggedDayCount) * 100) : null

  const kcalByDay = useMemo(() => new Map([...dailyTotals].map(([d, t]) => [d, t.kcal])), [dailyTotals])
  const kcalChartData = useMemo(() => {
    return bucketDailyAverage(kcalByDay, rangeDays, range.buckets).map((b) => ({
      label: b.label,
      value: b.value,
      display: b.value != null ? String(Math.round(b.value)) : undefined,
    }))
  }, [kcalByDay, rangeDays, range.buckets])

  const weightPoints = useMemo(
    () => weightLogs.map((l) => ({ date: l.log_date, value: Number(l.weight_kg) })),
    [weightLogs],
  )
  const weightChange =
    weightPoints.length >= 2 ? weightPoints[weightPoints.length - 1].value - weightPoints[0].value : null

  const fastingByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of fastingSessions) {
      const iso = toISODate(new Date(s.started_at))
      const endMs = s.ended_at ? new Date(s.ended_at).getTime() : Date.now()
      const hours = (endMs - new Date(s.started_at).getTime()) / 3_600_000
      map.set(iso, (map.get(iso) ?? 0) + hours)
    }
    return map
  }, [fastingSessions])

  const fastingChartData = useMemo(() => {
    return bucketDailyAverage(fastingByDay, rangeDays, range.buckets).map((b) => ({
      label: b.label,
      value: b.value,
      display: b.value != null ? `${(Math.round(b.value * 10) / 10).toLocaleString(getIntlLocale())}h` : undefined,
    }))
  }, [fastingByDay, rangeDays, range.buckets])

  const successfulFastingDays = useMemo(() => {
    const set = new Set<string>()
    for (const s of fastingSessions) {
      if (!s.ended_at) continue
      const durationHours = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 3_600_000
      if (durationHours >= s.target_hours) set.add(toISODate(new Date(s.started_at)))
    }
    return set
  }, [fastingSessions])

  const currentFastingStreak = useMemo(() => {
    const cursor = new Date()
    if (!successfulFastingDays.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1)
    let count = 0
    while (successfulFastingDays.has(toISODate(cursor))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [successfulFastingDays])

  const longestFastingStreak = useMemo(() => longestStreak(successfulFastingDays), [successfulFastingDays])

  function macroPct(avg: number, goal: number) {
    return goal > 0 ? Math.min(100, Math.round((avg / goal) * 100)) : 0
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          ‹ Zurück
        </Link>
      </div>
      <h1 className="font-display font-bold text-2xl">Auswertung{!hasPremium && ' 🔒'}</h1>

      {!hasPremium ? (
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col items-center text-center gap-3">
          <span className="text-3xl">📈</span>
          <p className="text-sm text-text-muted max-w-xs">
            Gewichts- und Kalorien-Trends über Wochen und Monate, Ziel-Trefferquote und dein Fastentrend — mit
            Nellicious Premium.
          </p>
          <button
            type="button"
            onClick={() => setShowPremiumModal(true)}
            className="bg-primary text-on-primary font-semibold rounded-xl px-5 py-2.5 text-sm"
          >
            Freischalten
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            {TREND_RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setRangeDays(r.days)}
                className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  rangeDays === r.days
                    ? 'bg-primary border-primary text-on-primary font-semibold'
                    : 'bg-surface-2 border-border text-text-muted'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface border border-border rounded-2xl p-3 flex flex-col gap-0.5 min-w-0">
              <span className="font-mono text-lg font-semibold">{avgKcal.toLocaleString(getIntlLocale())}</span>
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Ø kcal / Tag</span>
              <span className={`text-xs font-medium ${Math.abs(kcalGoalDeltaPct) <= 5 ? 'text-basil' : 'text-honey'}`}>
                {kcalGoalDeltaPct > 0 ? '+' : ''}
                {kcalGoalDeltaPct} % ggü. Ziel
              </span>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 flex flex-col gap-0.5 min-w-0">
              <span className="font-mono text-lg font-semibold">
                {weightChange != null ? `${weightChange > 0 ? '+' : ''}${formatWeightKg(weightChange)} kg` : '–'}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-text-muted">in {range.label}</span>
              <span className="text-xs text-text-muted break-words">Gewichtsveränderung</span>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 flex flex-col gap-0.5 min-w-0">
              <span className="font-mono text-lg font-semibold">{hitRate != null ? `${hitRate} %` : '–'}</span>
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Tage im Ziel</span>
              <span className="text-xs text-text-muted">±10 % Toleranz</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-semibold text-lg">⚖️ Gewichtsverlauf</h2>
            <WeightTrendChart points={weightPoints} color="var(--color-basil)" />
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
            <h2 className="font-display font-semibold text-lg">🔥 Kalorien-Trend</h2>
            <p className="text-xs text-text-muted -mt-1">Ø kcal/Tag je Abschnitt · Ziel {kcalGoal.toLocaleString(getIntlLocale())} kcal</p>
            <WeekBarChart data={kcalChartData} color="var(--color-primary)" />
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-semibold text-lg">🍽️ Makronährstoffe</h2>
            <p className="text-xs text-text-muted -mt-1">Ø pro Tag im gewählten Zeitraum, gegen dein Tagesziel</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-2 border border-border rounded-xl p-2.5 flex flex-col gap-1.5 min-w-0">
                <span className="font-mono text-sm font-semibold">{avgProtein} g</span>
                <span className="text-[10px] text-text-muted">Protein{proteinGoal > 0 ? ` · Ziel ${proteinGoal} g` : ''}</span>
                <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full bg-basil"
                    style={{ width: `${macroPct(avgProtein, proteinGoal)}%` }}
                  />
                </div>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-2.5 flex flex-col gap-1.5 min-w-0">
                <span className="font-mono text-sm font-semibold">{avgCarbs} g</span>
                <span className="text-[10px] text-text-muted">Kohlenh.{carbsGoal > 0 ? ` · Ziel ${carbsGoal} g` : ''}</span>
                <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full bg-honey"
                    style={{ width: `${macroPct(avgCarbs, carbsGoal)}%` }}
                  />
                </div>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-2.5 flex flex-col gap-1.5 min-w-0">
                <span className="font-mono text-sm font-semibold">{avgFat} g</span>
                <span className="text-[10px] text-text-muted">Fett{fatGoal > 0 ? ` · Ziel ${fatGoal} g` : ''}</span>
                <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${macroPct(avgFat, fatGoal)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-semibold text-lg">⏱️ Fastentrend</h2>
            <p className="text-xs text-text-muted -mt-1">Ø Fastenstunden pro Tag je Abschnitt</p>
            <WeekBarChart data={fastingChartData} color="var(--color-basil)" />
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-2 border border-border rounded-xl p-2.5 flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-sm font-semibold">🔥 {currentFastingStreak} Tage</span>
                <span className="text-[10px] text-text-muted">aktueller Streak</span>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-2.5 flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-sm font-semibold">🏆 {longestFastingStreak} Tage</span>
                <span className="text-[10px] text-text-muted">längste Serie ({range.label})</span>
              </div>
            </div>
          </div>
        </>
      )}

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  )
}
