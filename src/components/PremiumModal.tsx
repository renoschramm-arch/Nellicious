import { PREMIUM_TRIAL_DAYS, usePremium } from '../lib/usePremium'

const PREMIUM_FEATURES = [
  'Wochenplanung beliebig viele Wochen im Voraus und zurück',
  '🍳 Kochmodus: Bildschirm bleibt beim Kochen wach',
  '⏱️ Intervallfasten-Tracker mit Streak und Verlauf',
  '🎯 Mehrere Ziel-Profile speichern und mit einem Tap wechseln',
  '📤 Datenexport als CSV oder PDF-Bericht',
  '🍽️ Rezepte auf beliebig viele Portionen hochskalieren',
  '📈 Auswertung: Gewichts-, Kalorien- und Fastentrends über Wochen und Monate',
]

const MONTHLY_PRICE_EUR = 3.99
const YEARLY_PRICE_EUR = 39.99
const YEARLY_SAVINGS_PCT = Math.round((1 - YEARLY_PRICE_EUR / (MONTHLY_PRICE_EUR * 12)) * 100)

function formatEUR(value: number): string {
  return `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function PremiumModal({ onClose }: { onClose: () => void }) {
  const { trialActive, trialDaysLeft } = usePremium()

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-display font-semibold text-lg">🔒 Nellicious Premium</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-sm" aria-label="Schließen">
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          <p className="text-sm text-text-muted leading-relaxed">
            {trialActive
              ? `Diese Funktion gehört zu Nellicious Premium. Du testest sie gerade kostenlos — noch ${trialDaysLeft} ${trialDaysLeft === 1 ? 'Tag' : 'Tage'} übrig.`
              : `Diese Funktion gehört zu Nellicious Premium. Deine ${PREMIUM_TRIAL_DAYS}-tägige Testphase ist bereits vorbei.`}
          </p>
          <ul className="flex flex-col gap-1.5">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <span className="text-primary shrink-0">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-surface border border-border rounded-xl p-3 flex flex-col">
              <span className="text-xs text-text-muted">Monatlich</span>
              <span className="font-display font-semibold text-lg">{formatEUR(MONTHLY_PRICE_EUR)}</span>
              <span className="text-xs text-text-muted">pro Monat</span>
            </div>
            <div className="relative bg-primary/10 border border-primary/30 rounded-xl p-3 flex flex-col">
              <span className="absolute -top-2 right-2 bg-primary text-on-primary text-[10px] font-semibold rounded-full px-2 py-0.5">
                −{YEARLY_SAVINGS_PCT}%
              </span>
              <span className="text-xs text-text-muted">Jährlich</span>
              <span className="font-display font-semibold text-lg">{formatEUR(YEARLY_PRICE_EUR)}</span>
              <span className="text-xs text-text-muted">pro Jahr</span>
            </div>
          </div>

          <p className="text-sm text-text-muted leading-relaxed">
            Der Premium-Kauf ist noch in Arbeit — schau bald wieder vorbei.
          </p>
        </div>
      </div>
    </div>
  )
}
