import { jsPDF } from 'jspdf'
import { supabase } from './supabaseClient'
import { toISODate } from './week'
import { formatWeightKg } from './useWeightLogs'
import type { Database } from './database.types'

type MealLog = Database['public']['Tables']['meal_logs']['Row']
type WeightLog = Database['public']['Tables']['weight_logs']['Row']

export const EXPORT_RANGES = [
  { days: 30, label: 'Letzte 30 Tage' },
  { days: 90, label: 'Letzte 90 Tage' },
  { days: 3650, label: 'Gesamter Verlauf' },
] as const

export type ExportRangeDays = (typeof EXPORT_RANGES)[number]['days']

export async function fetchExportData(userId: string, days: number) {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const [{ data: mealLogs }, { data: weightLogs }] = await Promise.all([
    supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: true }),
    supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', toISODate(start))
      .lte('log_date', toISODate(end))
      .order('log_date', { ascending: true }),
  ])

  return { mealLogs: mealLogs ?? [], weightLogs: weightLogs ?? [] }
}

// Deutsches Excel erwartet standardmäßig Semikolon statt Komma als
// Trennzeichen (Komma ist dort das Dezimaltrennzeichen).
function escapeCsvField(value: string): string {
  return /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toCSV(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(';')).join('\r\n')
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFormatter = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function downloadMealLogsCSV(mealLogs: MealLog[]) {
  const rows = [
    ['Datum', 'Uhrzeit', 'Mahlzeit', 'kcal', 'Protein (g)', 'Kohlenhydrate (g)', 'Fett (g)'],
    ...mealLogs.map((log) => {
      const logged = new Date(log.logged_at)
      return [
        toISODate(logged),
        logged.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        log.name,
        String(log.kcal),
        String(log.protein_g),
        String(log.carbs_g),
        String(log.fat_g),
      ]
    }),
  ]
  downloadFile('nellicious-mahlzeiten.csv', toCSV(rows), 'text/csv;charset=utf-8')
}

export function downloadWeightLogsCSV(weightLogs: WeightLog[]) {
  const rows = [
    ['Datum', 'Gewicht (kg)'],
    ...weightLogs.map((log) => [log.log_date, formatWeightKg(Number(log.weight_kg))]),
  ]
  downloadFile('nellicious-gewicht.csv', toCSV(rows), 'text/csv;charset=utf-8')
}

function aggregateByDay(mealLogs: MealLog[]) {
  const byDay = new Map<string, { kcal: number; protein: number; carbs: number; fat: number }>()
  for (const log of mealLogs) {
    const day = toISODate(new Date(log.logged_at))
    const cur = byDay.get(day) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    cur.kcal += log.kcal
    cur.protein += log.protein_g
    cur.carbs += log.carbs_g
    cur.fat += log.fat_g
    byDay.set(day, cur)
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function generatePDFReport({
  mealLogs,
  weightLogs,
  rangeLabel,
  userEmail,
}: {
  mealLogs: MealLog[]
  weightLogs: WeightLog[]
  rangeLabel: string
  userEmail: string
}): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const marginX = 18
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 22

  function ensureSpace(next: number) {
    if (y + next > pageHeight - 16) {
      doc.addPage()
      y = 20
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Nellicious — Verlaufsbericht', marginX, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text(`${userEmail} · ${rangeLabel} · erstellt am ${dateTimeFormatter.format(new Date())}`, marginX, y)
  doc.setTextColor(0)
  y += 12

  const daily = aggregateByDay(mealLogs)
  const dayCount = daily.length || 1
  const avgKcal = Math.round(daily.reduce((sum, [, d]) => sum + d.kcal, 0) / dayCount)
  const avgProtein = Math.round(daily.reduce((sum, [, d]) => sum + d.protein, 0) / dayCount)
  const avgCarbs = Math.round(daily.reduce((sum, [, d]) => sum + d.carbs, 0) / dayCount)
  const avgFat = Math.round(daily.reduce((sum, [, d]) => sum + d.fat, 0) / dayCount)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Zusammenfassung', marginX, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.text(`Geloggte Tage: ${daily.length}`, marginX, y)
  y += 6
  doc.text(
    `Ø pro Tag: ${avgKcal} kcal · ${avgProtein} g Protein · ${avgCarbs} g Kohlenh. · ${avgFat} g Fett`,
    marginX,
    y,
  )
  y += 6

  if (weightLogs.length > 0) {
    const first = Number(weightLogs[0].weight_kg)
    const last = Number(weightLogs[weightLogs.length - 1].weight_kg)
    const diff = last - first
    const sign = diff > 0 ? '+' : ''
    doc.text(
      `Gewicht: ${formatWeightKg(first)} kg → ${formatWeightKg(last)} kg (${sign}${formatWeightKg(diff)} kg)`,
      marginX,
      y,
    )
    y += 6
  }
  y += 6

  function tableHeader(title: string, columns: string[], widths: number[]) {
    ensureSpace(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(title, marginX, y)
    y += 7
    doc.setFontSize(9.5)
    let x = marginX
    columns.forEach((col, i) => {
      doc.text(col, x, y)
      x += widths[i]
    })
    y += 1.5
    doc.setDrawColor(200)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 5
    doc.setFont('helvetica', 'normal')
  }

  if (daily.length > 0) {
    const columns = ['Datum', 'kcal', 'Protein (g)', 'Kohlenh. (g)', 'Fett (g)']
    const widths = [35, 25, 30, 32, 25]
    tableHeader('Mahlzeiten pro Tag', columns, widths)
    for (const [day, totals] of daily) {
      ensureSpace(6)
      let x = marginX
      const cells = [
        dateFormatter.format(new Date(`${day}T00:00:00`)),
        String(Math.round(totals.kcal)),
        String(Math.round(totals.protein)),
        String(Math.round(totals.carbs)),
        String(Math.round(totals.fat)),
      ]
      cells.forEach((cell, i) => {
        doc.text(cell, x, y)
        x += widths[i]
      })
      y += 5.5
    }
    y += 8
  }

  if (weightLogs.length > 0) {
    tableHeader('Gewichtsverlauf', ['Datum', 'Gewicht (kg)'], [35, 30])
    for (const log of weightLogs) {
      ensureSpace(6)
      doc.text(dateFormatter.format(new Date(`${log.log_date}T00:00:00`)), marginX, y)
      doc.text(formatWeightKg(Number(log.weight_kg)), marginX + 35, y)
      y += 5.5
    }
  }

  return doc
}
