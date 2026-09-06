export interface TrendPoint {
  label: string
  value: number | null
}

const WIDTH = 400
const HEIGHT = 108
const LEFT = 34
const RIGHT = 8
const TOP = 12
const BOTTOM = 76
const X_LABEL_Y = 92

// Verbundener Linien-/Flächen-Chart im Stil von WeightTrendChart, aber für
// generische Label/Wert-Reihen (Trend-Buckets aus trendBuckets.ts) statt
// fester Datums-Punkte — u.a. für Kalorien- und Fastentrend auf der
// Auswertungsseite, damit alle Trend-Charts dort einheitlich aussehen.
export function TrendLineChart({
  data,
  color,
  formatValue = (v) => `${Math.round(v)}`,
  emptyMessage = 'Noch nicht genug Einträge für diesen Zeitraum.',
}: {
  data: TrendPoint[]
  color: string
  formatValue?: (value: number) => string
  emptyMessage?: string
}) {
  const values = data.map((d) => d.value).filter((v): v is number => v != null)

  if (values.length < 2) {
    return <p className="text-sm text-text-muted h-28 flex items-center">{emptyMessage}</p>
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

  // Linie und Flächenfüllung je zusammenhängendem Teilstück statt einem
  // durchgehenden Pfad — sonst würde eine Lücke (Bucket ohne Eintrag) die
  // Nachbarpunkte optisch verbinden, obwohl dazwischen kein Messwert liegt.
  const fillBase = BOTTOM + 8
  const lineSegments: string[] = []
  const areaSegments: string[] = []
  let run: { x: number; y: number }[] = []
  const flushRun = () => {
    if (run.length >= 2) {
      lineSegments.push(run.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' '))
      areaSegments.push(
        `M ${run[0].x} ${run[0].y} ` +
          run
            .slice(1)
            .map((c) => `L ${c.x} ${c.y}`)
            .join(' ') +
          ` L ${run[run.length - 1].x} ${fillBase} L ${run[0].x} ${fillBase} Z`,
      )
    }
    run = []
  }
  for (const c of coords) {
    if (!c) {
      flushRun()
      continue
    }
    run.push(c)
  }
  flushRun()

  const lastIndex = [...coords].reverse().findIndex((c) => c != null)
  const last = lastIndex >= 0 ? coords[coords.length - 1 - lastIndex] : null

  // Eine Handvoll Ticks statt einem Label pro Bucket — sonst überladen zu
  // viele Beschriftungen die x-Achse.
  const tickCount = Math.min(6, data.length)
  const tickIndices = Array.from(
    new Set(Array.from({ length: tickCount }, (_, k) => Math.round((k * (data.length - 1)) / (tickCount - 1)))),
  )

  return (
    <svg
      className="w-full h-28 block overflow-visible"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Verlauf über ${data.length} Abschnitte`}
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

      {areaSegments.map((d, i) => (
        <path key={i} d={d} fill={color} opacity="0.14" />
      ))}
      {lineSegments.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {last && (
        <>
          <circle cx={last.x} cy={last.y} r="7" fill="none" stroke={color} strokeWidth="1.5" opacity="0.35" />
          <circle cx={last.x} cy={last.y} r="3.2" fill={color} />
        </>
      )}

      {tickIndices.map((i) => {
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
            {data[i].label}
          </text>
        )
      })}
    </svg>
  )
}
