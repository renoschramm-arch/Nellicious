import { useState } from 'react'

export function TagLegend({ items }: { items: { label: string; description: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative w-fit">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-text-muted hover:text-text"
      >
        ⓘ Begriffe erklärt
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 w-72 max-w-[80vw] bg-surface border border-border rounded-xl shadow-[var(--shadow)] p-3 flex flex-col gap-2">
          <dl className="flex flex-col gap-1.5 text-xs">
            {items.map((item) => (
              <div key={item.label}>
                <dt className="font-medium text-text inline">{item.label}: </dt>
                <dd className="inline text-text-muted">{item.description}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-text-muted self-end"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  )
}
