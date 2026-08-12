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
  return date.toISOString().slice(0, 10)
}

const dayLabelFormat = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
})

export function formatDayLabel(date: Date): string {
  return dayLabelFormat.format(date)
}

const rangeFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' })

export function formatWeekRange(monday: Date, sunday: Date): string {
  return `${rangeFormat.format(monday)} – ${rangeFormat.format(sunday)}`
}
