import { PREMIUM_TRIAL_DAYS, usePremium } from '../lib/usePremium'

const PREMIUM_FEATURES = [
  'Wochenplanung beliebig viele Wochen im Voraus und zurück',
  '🍳 Kochmodus: Bildschirm bleibt beim Kochen wach',
]

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
          <p className="text-sm text-text-muted leading-relaxed">
            Der Premium-Kauf ist noch in Arbeit — schau bald wieder vorbei.
          </p>
        </div>
      </div>
    </div>
  )
}
