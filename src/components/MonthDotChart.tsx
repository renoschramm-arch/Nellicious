import { formatShortDate } from '../lib/week'

export type DotDatum = { value: number | null; date?: Date }

const WIDTH = 400
const HEIGHT = 108
const LEFT = 34
const RIGHT = 8
const TOP = 12
const BOTTOM = 76
const X_LABEL_Y = 92

// Punktdiagramm für die 30-Tage-Ansicht: bei 30 Datenpunkten wären Balken
// (wie in WeekBarChart) zu schmal, um noch einzeln lesbar zu sein — einzelne
// Punkte pro Tag bleiben auch bei dieser Dichte klar unterscheidbar. Tage
// ohne Eintrag bekommen bewusst keinen Punkt (statt z.B. 0), da ein
// fehlender Eintrag kein Messwert ist.
export function MonthDotChart({
  data,
  color,
  formatValue = (v) => `${Math.round(v)}`,
}: {
  data: DotDatum[]
  color: string
  formatValue?: (value: number) => string
}) {
  const values = data.map((d) => d.value).filter((v): v is number => v != null)

  if (values.length < 2) {
    return <p className="text-sm text-text-muted h-28 flex items-center">Noch nicht genug Einträge für diesen Zeitraum.</p>
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = (WIDTH - LEFT - RIGHT) / (data.length - 1)

  const coords = data.map((d, i) =>
    d.value == null
      ? null
      : {
          x: LEFT + i * stepX,
          y: BOTTOM - ((d.value - min) / range) * (BOTTOM - TOP),
        },
  )

  const lastIndex = [...coords].reverse().findIndex((c) => c != null)
  const lastCoord = lastIndex >= 0 ? coords[coords.length - 1 - lastIndex] : null

  // Verbindungslinie in einzelnen Teilstücken statt einem durchgehenden Pfad
  // — sonst würde eine Lücke (Tag ohne Eintrag) die Nachbarpunkte optisch
  // verbinden, obwohl dazwischen gar kein Messwert liegt.
  const segments: string[] = []
  let current = ''
  for (const c of coords) {
    if (!c) {
      if (current) segments.push(current)
      current = ''
      continue
    }
    current += current ? ` L ${c.x} ${c.y}` : `M ${c.x} ${c.y}`
  }
  if (current) segments.push(current)

  // Eine Handvoll Datums-Ticks statt einem Label pro Tag — bei 30 Punkten
  // würde das die x-Achse unlesbar überladen.
  const tickCount = Math.min(6, data.length)
  const tickIndices = Array.from(
    new Set(
      Array.from({ length: tickCount }, (_, k) => Math.round((k * (data.length - 1)) / (tickCount - 1))),
    ),
  )

  return (
    <svg
      className="w-full h-28 block overflow-visible"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Verlauf der letzten ${data.length} Tage`}
    >
      <line x1={LEFT} y1={TOP} x2={WIDTH - RIGHT} y2={TOP} stroke="var(--color-border)" strokeWidth="1" />
      <line
        x1={LEFT}
        y1={(TOP + BOTTOM) / 2}
        x2={WIDTH - RIGHT}
        y2={(TOP + BOTTOM) / 2}
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      <line x1={LEFT} y1={BOTTOM} x2={WIDTH - RIGHT} y2={BOTTOM} stroke="var(--color-border)" strokeWidth="1" />

      <text x={LEFT - 4} y={TOP + 3} textAnchor="end" fontSize="8" fill="var(--color-text-muted)">
        {formatValue(max)}
      </text>
      <text x={LEFT - 4} y={BOTTOM + 3} textAnchor="end" fontSize="8" fill="var(--color-text-muted)">
        {formatValue(min)}
      </text>

      {segments.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
      ))}

      {coords.map(
        (c, i) =>
          c && (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={c === lastCoord ? 3.4 : 2.2}
              fill={color}
              opacity={c === lastCoord ? 1 : 0.55}
            />
          ),
      )}

      {tickIndices.map((i) => {
        const date = data[i]?.date
        if (!date) return null
        const anchor = i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'
        return (
          <text
            key={i}
            x={LEFT + i * stepX}
            y={X_LABEL_Y}
            textAnchor={anchor}
            fontSize="8"
            fill="var(--color-text-muted)"
          >
            {formatShortDate(date)}
          </text>
        )
      })}
    </svg>
  )
}
