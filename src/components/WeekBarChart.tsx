type BarDatum = { label: string; value: number | null; display?: string }

export function WeekBarChart({ data, color }: { data: BarDatum[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value ?? 0), 1)

  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] text-text-muted font-mono truncate w-full text-center">
            {d.value != null ? (d.display ?? d.value) : '–'}
          </span>
          <div className="w-full flex items-end justify-center h-16">
            <div
              className="w-full max-w-6 rounded-t-[4px]"
              style={{
                height: d.value != null ? `${Math.max((d.value / max) * 100, 4)}%` : '2px',
                backgroundColor: d.value != null ? color : 'var(--color-border)',
              }}
            />
          </div>
          <span className="text-[10px] text-text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
