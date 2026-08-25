import { useTranslation } from 'react-i18next'
import { FASTING_PHASES } from '../lib/useFasting'

export function FastingPhaseModal({
  elapsedHours,
  onClose,
}: {
  elapsedHours: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-surface p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg">{t('fastingPhaseModal.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('fastingPhaseModal.close')}
            className="text-text-muted hover:text-text text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {FASTING_PHASES.map((phase) => {
            const isCurrent = elapsedHours != null && elapsedHours >= phase.fromH && elapsedHours < phase.toH
            return (
              <div
                key={phase.title}
                className={`rounded-xl border p-3 ${
                  isCurrent ? 'border-basil bg-basil/10' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">
                    {phase.title}
                    {isCurrent && <span className="text-basil">{t('fastingPhaseModal.now')}</span>}
                  </span>
                  <span className="font-mono text-xs text-text-muted shrink-0">{phase.range}</span>
                </div>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{phase.text}</p>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-text-muted mt-3">{t('fastingPhaseModal.disclaimer')}</p>
      </div>
    </div>
  )
}
