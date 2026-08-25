import { useTranslation } from 'react-i18next'

const PAYPAL_URL = 'https://paypal.me/renoschramm'

export function SupportModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
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
          <h2 className="font-display font-semibold text-lg">{t('support.title')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-sm" aria-label={t('support.close')}>
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          <p className="text-sm text-text-muted leading-relaxed">{t('support.paragraph1')}</p>
          <p className="text-sm text-text-muted leading-relaxed">{t('support.paragraph2')}</p>

          <a
            href={PAYPAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-2 bg-white border border-border rounded-xl py-3 text-sm shadow-sm hover:border-[#009cde] transition-colors"
          >
            <span className="text-[#16110d]">{t('support.continueToPaypal')}</span>
            <span className="font-sans italic tracking-tight text-base">
              <span className="font-bold text-[#003087]">Pay</span>
              <span className="font-bold text-[#009cde]">Pal</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
