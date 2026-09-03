import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isPasskeySupported, usePasskeys } from '../lib/usePasskeys'

export function PasskeysPage() {
  const { t, i18n } = useTranslation()
  const { passkeys, loading, registerPasskey, deletePasskey } = usePasskeys()
  const supported = isPasskeySupported()

  async function handleAdd() {
    const result = await registerPasskey()
    if (result.error) window.alert(result.error)
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('passkeys.confirmDelete'))) return
    const result = await deletePasskey(id)
    if (result.error) window.alert(result.error)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          {t('common.back')}
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-bold text-2xl">{t('passkeys.title')}</h1>
        <p className="text-text-muted text-sm">{t('passkeys.description')}</p>
      </div>

      {!supported && (
        <p className="bg-surface border border-border rounded-2xl p-4 text-sm text-text-muted">
          {t('passkeys.unsupported')}
        </p>
      )}

      {supported && !loading && passkeys.length === 0 && (
        <p className="text-sm text-text-muted">{t('passkeys.none')}</p>
      )}

      {passkeys.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {passkeys.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex flex-col">
                <span className="font-medium text-sm">{p.friendlyName || t('passkeys.unnamed')}</span>
                <span className="text-xs text-text-muted">
                  {t('passkeys.addedOn', {
                    date: new Intl.DateTimeFormat(i18n.language).format(new Date(p.createdAt)),
                  })}
                </span>
              </span>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-danger text-sm hover:opacity-70"
                aria-label={t('passkeys.delete')}
              >
                {t('passkeys.delete')}
              </button>
            </div>
          ))}
        </div>
      )}

      {supported && (
        <button
          onClick={handleAdd}
          className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm"
        >
          {t('passkeys.add')}
        </button>
      )}
    </div>
  )
}
