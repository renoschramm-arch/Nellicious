import { useTranslation } from 'react-i18next'
import { PREMIUM_TRIAL_DAYS, usePremium } from '../lib/usePremium'
import { getIntlLocale } from '../lib/i18n'

const MONTHLY_PRICE_EUR = 3.99
const YEARLY_PRICE_EUR = 39.99
const YEARLY_SAVINGS_PCT = Math.round((1 - YEARLY_PRICE_EUR / (MONTHLY_PRICE_EUR * 12)) * 100)

function formatEUR(value: number): string {
  return `${value.toLocaleString(getIntlLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function PremiumModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { trialActive, trialDaysLeft } = usePremium()
  const features = t('premium.features', { returnObjects: true }) as string[]

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
          <h2 className="font-display font-semibold text-lg">{t('premium.title')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-sm" aria-label={t('premium.close')}>
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          <p className="text-sm text-text-muted leading-relaxed">
            {trialActive
              ? t('premium.trialActiveText', { count: trialDaysLeft })
              : t('premium.trialOverText', { days: PREMIUM_TRIAL_DAYS })}
          </p>

          <p className="text-sm text-honey bg-honey/10 border border-honey/30 rounded-xl px-3 py-2.5 leading-relaxed">
            {t('premium.purchaseWip')}
          </p>

          <ul className="flex flex-col gap-1.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <span className="text-primary shrink-0">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-text-muted uppercase tracking-wide font-mono mt-1">
            {t('premium.plannedPricing')}
          </p>
          <div className="grid grid-cols-2 gap-2 opacity-70">
            <div className="bg-surface border border-dashed border-border rounded-xl p-3 flex flex-col">
              <span className="text-xs text-text-muted">{t('premium.monthly')}</span>
              <span className="font-display font-semibold text-lg">{formatEUR(MONTHLY_PRICE_EUR)}</span>
              <span className="text-xs text-text-muted">{t('premium.perMonth')}</span>
            </div>
            <div className="relative bg-surface border border-dashed border-border rounded-xl p-3 flex flex-col">
              <span className="absolute -top-2 right-2 bg-text-muted text-bg text-[10px] font-semibold rounded-full px-2 py-0.5">
                −{YEARLY_SAVINGS_PCT}%
              </span>
              <span className="text-xs text-text-muted">{t('premium.yearly')}</span>
              <span className="font-display font-semibold text-lg">{formatEUR(YEARLY_PRICE_EUR)}</span>
              <span className="text-xs text-text-muted">{t('premium.perYear')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
