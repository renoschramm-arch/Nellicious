export type DotDatum = { value: number | null }

const WIDTH = 400
const HEIGHT = 108
const PAD_X = 6
const TOP = 10
const BOTTOM = 92

// Punktdiagramm für die 30-Tage-Ansicht: bei 30 Datenpunkten wären Balken
// (wie in WeekBarChart) zu schmal, um noch einzeln lesbar zu sein — einzelne
// Punkte pro Tag bleiben auch bei dieser Dichte klar unterscheidbar. Tage
// ohne Eintrag bekommen bewusst keinen Punkt (statt z.B. 0), da ein
// fehlender Eintrag kein Messwert ist.
export function MonthDotChart({ data, color }: { data: DotDatum[]; color: string }) {
  const values = data.map((d) => d.value).filter((v): v is number => v != null)

  if (values.length < 2) {
    return <p className="text-sm text-text-muted h-28 flex items-center">Noch nicht genug Einträge für diesen Zeitraum.</p>
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = (WIDTH - 2 * PAD_X) / (data.length - 1)

  const coords = data.map((d, i) =>
    d.value == null
      ? null
      : {
          x: PAD_X + i * stepX,
          y: BOTTOM - ((d.value - min) / range) * (BOTTOM - TOP),
        },
  )

  const lastIndex = [...coords].reverse().findIndex((c) => c != null)
  const lastCoord = lastIndex >= 0 ? coords[coords.length - 1 - lastIndex] : null

  return (
    <svg
      className="w-full h-28 block overflow-visible"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Verlauf der letzten ${data.length} Tage`}
    >
      <line x1={PAD_X} y1={TOP} x2={WIDTH - PAD_X} y2={TOP} stroke="var(--color-border)" strokeWidth="1" />
      <line
        x1={PAD_X}
        y1={(TOP + BOTTOM) / 2}
        x2={WIDTH - PAD_X}
        y2={(TOP + BOTTOM) / 2}
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      <line x1={PAD_X} y1={BOTTOM} x2={WIDTH - PAD_X} y2={BOTTOM} stroke="var(--color-border)" strokeWidth="1" />
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
    </svg>
  )
}
