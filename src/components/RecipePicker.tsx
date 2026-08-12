import { useState } from 'react'
import { useRecipes } from '../lib/useRecipes'

export function RecipePicker({
  onSelect,
  onClose,
}: {
  onSelect: (recipeId: string) => void
  onClose: () => void
}) {
  const { recipes, loading } = useRecipes()
  const [query, setQuery] = useState('')
  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="absolute z-10 top-full left-0 mt-1 w-64 bg-surface border border-border rounded-xl shadow-[var(--shadow)] p-3 flex flex-col gap-2">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rezept suchen …"
        className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-primary"
      />
      <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
        {loading && <p className="text-xs text-text-muted px-1">Lädt …</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-xs text-text-muted px-1">Keine Treffer.</p>
        )}
        {filtered.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="text-left text-sm px-2 py-1.5 rounded-lg hover:bg-surface-2"
          >
            {r.title}
          </button>
        ))}
      </div>
      <button onClick={onClose} className="text-xs text-text-muted self-end">
        Abbrechen
      </button>
    </div>
  )
}
