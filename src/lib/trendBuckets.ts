import type { TFunction } from 'i18next'
import { toISODate } from './week'
import { getIntlLocale } from './i18n'

export const TREND_RANGES = [
  { days: 30, buckets: 10 },
  { days: 90, buckets: 13 },
  { days: 365, buckets: 12 },
] as const

export type TrendRangeDays = (typeof TREND_RANGES)[number]['days']

const TREND_RANGE_KEYS: Record<TrendRangeDays, string> = {
  30: 'trendBuckets.range30',
  90: 'trendBuckets.range90',
  365: 'trendBuckets.range365',
}

export function trendRangeLabel(t: TFunction, days: TrendRangeDays): string {
  return t(TREND_RANGE_KEYS[days])
}

export interface TrendBucket {
  label: string
  value: number | null
}

function bucketLabelFormatter() {
  return new Intl.DateTimeFormat(getIntlLocale(), { day: '2-digit', month: '2-digit' })
}

// Teilt einen Zeitraum in `bucketCount` gleich lange, aufeinanderfolgende
// Abschnitte und bildet je Abschnitt den Tagesdurchschnitt — über alle
// Kalendertage des Abschnitts, nicht nur über Tage mit Einträgen (gleiche
// Konvention wie der Wochendurchschnitt auf der Verlauf-Seite). So bleibt
// die Anzahl der Balken unabhängig vom gewählten Zeitraum überschaubar.
export function bucketDailyAverage(
  dailyTotals: Map<string, number>,
  days: number,
  bucketCount: number,
): TrendBucket[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  const daysPerBucket = days / bucketCount
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    sum: 0,
    dayCount: 0,
    startDate: new Date(start.getTime() + Math.round(i * daysPerBucket) * 86_400_000),
  }))

  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86_400_000)
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(i / daysPerBucket))
    buckets[bucketIndex].dayCount++
    buckets[bucketIndex].sum += dailyTotals.get(toISODate(date)) ?? 0
  }

  return buckets.map((b) => ({
    label: bucketLabelFormatter().format(b.startDate),
    value: b.dayCount > 0 ? b.sum / b.dayCount : null,
  }))
}

// Längste Serie aufeinanderfolgender Kalendertage in `days` — unabhängig
// von "heute", im Gegensatz zum laufenden Streak in useFasting/useMealLogs.
export function longestStreak(days: Set<string>): number {
  let longest = 0
  let current = 0
  const sorted = [...days].sort()
  let prev: string | null = null
  for (const day of sorted) {
    if (prev) {
      const prevDate = new Date(`${prev}T00:00:00`)
      prevDate.setDate(prevDate.getDate() + 1)
      current = toISODate(prevDate) === day ? current + 1 : 1
    } else {
      current = 1
    }
    longest = Math.max(longest, current)
    prev = day
  }
  return longest
}
