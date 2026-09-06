import { formatShortDate } from '../lib/week'
import { formatWeightKg } from '../lib/useWeightLogs'

export interface WeightPoint {
  date: string
  value: number
}

const WIDTH = 400
const HEIGHT = 108
const LEFT = 34
const RIGHT = 8
const TOP = 12
const BOTTOM = 76
const X_LABEL_Y = 92

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function WeightTrendChart({ points, color }: { points: WeightPoint[]; color: string }) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-text-muted">Noch nicht genug Gewichtseinträge für einen Verlauf in diesem Zeitraum.</p>
    )
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = (WIDTH - LEFT - RIGHT) / (points.length - 1)

  const coords = points.map((p, i) => ({
    x: LEFT + i * stepX,
    y: BOTTOM - ((p.value - min) / range) * (BOTTOM - TOP),
  }))

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const fillBase = BOTTOM + 8
  const areaPath = `M${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)} L${coords
    .slice(1)
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' L')} L${coords[coords.length - 1].x.toFixed(1)},${fillBase} L${coords[0].x.toFixed(1)},${fillBase} Z`

  const last = coords[coords.length - 1]

  // Eine Handvoll Datums-Ticks statt einem Label pro Eintrag — bei vielen
  // Gewichtseinträgen würde das die x-Achse unlesbar überladen.
  const tickCount = Math.min(6, points.length)
  const tickIndices = Array.from(
    new Set(
      Array.from({ length: tickCount }, (_, k) => Math.round((k * (points.length - 1)) / (tickCount - 1))),
    ),
  )

  return (
    <svg
      className="w-full h-auto block overflow-visible"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Gewichtsverlauf von ${points[0].value} bis ${points[points.length - 1].value} kg`}
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
        {formatWeightKg(max)}
      </text>
      <text x={LEFT - 4} y={BOTTOM + 3} textAnchor="end" fontSize="8" fill="var(--color-text-muted)">
        {formatWeightKg(min)}
      </text>

      <path d={areaPath} fill={color} opacity="0.14" />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="7" fill="none" stroke={color} strokeWidth="1.5" opacity="0.35" />
      <circle cx={last.x} cy={last.y} r="3.2" fill={color} />

      {tickIndices.map((i) => {
        const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'
        return (
          <text
            key={i}
            x={LEFT + i * stepX}
            y={X_LABEL_Y}
            textAnchor={anchor}
            fontSize="8"
            fill="var(--color-text-muted)"
          >
            {formatShortDate(parseIsoDate(points[i].date))}
          </text>
        )
      })}
    </svg>
  )
}
