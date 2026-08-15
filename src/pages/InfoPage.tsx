import { Link } from 'react-router-dom'

const PAYPAL_URL = 'https://paypal.me/renoschramm'

export function InfoPage() {
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

      <div className="flex flex-col items-center text-center gap-1 py-2">
        <img
          src={`${import.meta.env.BASE_URL}icon-192.png`}
          alt="Nellicious"
          className="w-16 h-16 rounded-2xl mb-2"
        />
        <span className="font-display font-bold text-2xl">
          Nelli<span className="text-primary">cious</span>
        </span>
        <span className="text-text-muted text-sm">Gesund ernähren</span>
        <span className="text-text-muted text-xs mt-1">Version 1.30</span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <span className="text-sm font-medium">Entwickelt von</span>
          <p className="text-text-muted text-sm">Reno Schramm</p>
        </div>
        <div>
          <span className="text-sm font-medium">Gebaut mit</span>
          <p className="text-text-muted text-sm">React, TypeScript, Vite, Tailwind CSS, Supabase</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-primary">♥ Danksagung</span>
        <p className="text-sm text-text-muted">
          Diesen Namen gäbe es nicht ohne meine Tochter <strong className="text-text">Nelli</strong> — die
          Idee, ihren Namen mit einer Ernährungs-App zu verbinden. Nellicious, angelehnt an „Delicious".
          Danke, du bist die beste Namensgeberin. ❤️
        </p>
      </div>

      <details className="bg-surface border border-border rounded-2xl p-4 group">
        <summary className="flex items-center justify-between gap-2 cursor-pointer text-sm font-semibold list-none">
          <span>📲 Zum Home-Bildschirm hinzufügen</span>
          <span className="text-text-muted transition-transform group-open:rotate-180">▾</span>
        </summary>
        <ol className="text-sm text-text-muted mt-3 flex flex-col gap-1.5 list-decimal list-inside">
          <li>Teilen-Symbol unten in Safari antippen</li>
          <li>„Zum Home-Bildschirm" auswählen</li>
          <li>Mit „Hinzufügen" bestätigen</li>
        </ol>
      </details>

      <a
        href={PAYPAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
      >
        🧡 Unterstütze mich
      </a>

      <p className="text-center text-xs text-text-muted">
        © 2026 Nellicious. Alle Rechte vorbehalten.
        <br />
        Nur zur privaten Nutzung.
      </p>
    </div>
  )
}
