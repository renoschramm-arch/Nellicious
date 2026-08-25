import { getIntlLocale } from './i18n'

export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Locale wird bei jedem Aufruf frisch gelesen (statt einmalig beim Modul-Import),
// damit ein Sprachwechsel zur Laufzeit sofort auf alle Formatierungen wirkt.
export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat(getIntlLocale(), { weekday: 'short', day: '2-digit', month: '2-digit' }).format(date)
}

export function formatWeekRange(monday: Date, sunday: Date): string {
  const format = new Intl.DateTimeFormat(getIntlLocale(), { day: '2-digit', month: '2-digit' })
  return `${format.format(monday)} – ${format.format(sunday)}`
}

export function formatWeekdayShort(date: Date): string {
  return new Intl.DateTimeFormat(getIntlLocale(), { weekday: 'short' }).format(date).replace('.', '')
}
