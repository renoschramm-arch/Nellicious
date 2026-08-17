import { Link } from 'react-router-dom'
import { useTheme, type ThemePreference } from '../lib/theme'
import { useFontSize, type FontSizePreference } from '../lib/fontSize'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
]

const FONT_SIZE_OPTIONS: { value: FontSizePreference; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'gross', label: 'Groß' },
]

export function DarstellungPage() {
  const { theme, setTheme } = useTheme()
  const { fontSize, setFontSize } = useFontSize()

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
      <h1 className="font-display font-bold text-2xl">Darstellung</h1>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm text-text-muted">Design</span>
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-primary text-on-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm text-text-muted">Schriftgröße</span>
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
          {FONT_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFontSize(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                fontSize === option.value
                  ? 'bg-primary text-on-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted">
          Gilt für die ganze App — hilfreich, wenn Text auf dem Handy schwer zu lesen ist.
        </span>
      </div>
    </div>
  )
}
