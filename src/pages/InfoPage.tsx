import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { APP_VERSION } from '../lib/whatsNew'
import { SupportModal } from '../components/SupportModal'

export function InfoPage() {
  const { t } = useTranslation()
  const [showSupportModal, setShowSupportModal] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          {t('info.back')}
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
        <span className="text-text-muted text-sm">{t('info.tagline')}</span>
        <span className="text-text-muted text-xs mt-1">{t('info.version', { version: APP_VERSION })}</span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <span className="text-sm font-medium">{t('info.developedBy')}</span>
          <p className="text-text-muted text-sm">{t('info.developerName')}</p>
        </div>
        <div>
          <span className="text-sm font-medium">{t('info.builtWith')}</span>
          <p className="text-text-muted text-sm">{t('info.techStack')}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-primary">{t('info.thanksTitle')}</span>
        <p className="text-sm text-text-muted">
          {t('info.thanksTextBefore')} <strong className="text-text">{t('info.thanksName')}</strong>{' '}
          {t('info.thanksTextAfter')}
        </p>
      </div>

      <details className="bg-surface border border-border rounded-2xl p-4 group">
        <summary className="flex items-center justify-between gap-2 cursor-pointer text-sm font-semibold list-none">
          <span>{t('info.addToHomeScreen')}</span>
          <span className="text-text-muted transition-transform group-open:rotate-180">▾</span>
        </summary>
        <ol className="text-sm text-text-muted mt-3 flex flex-col gap-1.5 list-decimal list-inside">
          <li>{t('info.step1')}</li>
          <li>{t('info.step2')}</li>
          <li>{t('info.step3')}</li>
        </ol>
      </details>

      <button
        onClick={() => setShowSupportModal(true)}
        className="text-center bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
      >
        {t('info.supportMe')}
      </button>

      <p className="text-center text-xs text-text-muted">
        {t('info.copyright')}
        <br />
        {t('info.privateUseOnly')}
      </p>

      {showSupportModal && <SupportModal onClose={() => setShowSupportModal(false)} />}
    </div>
  )
}
