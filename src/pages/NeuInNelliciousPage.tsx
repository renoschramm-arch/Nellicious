import { Link } from 'react-router-dom'
import { getChangelogHistory } from '../lib/whatsNew'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

function formatEntryDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00`))
}

export function NeuInNelliciousPage() {
  const history = getChangelogHistory()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          ‹ Zurück
        </Link>
      </div>
      <h1 className="font-display font-bold text-2xl">Neu in Nellicious</h1>

      <div className="flex flex-col gap-3">
        {history.map((entry) => (
          <div key={entry.date} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wide text-honey">
              {formatEntryDate(entry.date)}
            </span>
            <ul className="flex flex-col gap-1.5">
              {entry.items.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-honey shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
