export interface WeightPoint {
  date: string
  value: number
}

const WIDTH = 400
const HEIGHT = 108
const PAD_X = 8
const TOP = 8
const BOTTOM = 92

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
  const stepX = (WIDTH - 2 * PAD_X) / (points.length - 1)

  const coords = points.map((p, i) => ({
    x: PAD_X + i * stepX,
    y: BOTTOM - ((p.value - min) / range) * (BOTTOM - TOP),
  }))

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const areaPath = `M${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)} L${coords
    .slice(1)
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' L')} L${coords[coords.length - 1].x.toFixed(1)},100 L${coords[0].x.toFixed(1)},100 Z`

  const last = coords[coords.length - 1]

  return (
    <svg
      className="w-full h-auto block overflow-visible"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Gewichtsverlauf von ${points[0].value} bis ${points[points.length - 1].value} kg`}
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
    </svg>
  )
}
