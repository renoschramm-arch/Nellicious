import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthContext'
import { deleteAccount } from '../lib/useDeleteAccount'

export function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmWord = t('deleteAccount.confirmWord')
  const canDelete = confirmText.trim().toLowerCase() === confirmWord.toLowerCase()

  async function handleDelete() {
    if (!canDelete || deleting) return
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount()
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteAccount.error'))
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-display font-semibold text-lg text-red-600">{t('deleteAccount.title')}</h2>
          {!deleting && (
            <button onClick={onClose} className="text-text-muted hover:text-text text-sm" aria-label={t('deleteAccount.close')}>
              ✕
            </button>
          )}
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          <p className="text-sm text-text-muted leading-relaxed">{t('deleteAccount.warning')}</p>
          <ul className="text-sm text-text-muted list-disc list-inside flex flex-col gap-1">
            <li>{t('deleteAccount.itemProfile')}</li>
            <li>{t('deleteAccount.itemRecipes')}</li>
            <li>{t('deleteAccount.itemLogs')}</li>
            <li>{t('deleteAccount.itemPlan')}</li>
          </ul>
          <p className="text-sm text-text-muted leading-relaxed">
            {t('deleteAccount.typeToConfirm', { word: confirmWord })}
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmWord}
            disabled={deleting}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
          >
            {deleting ? t('deleteAccount.deleting') : t('deleteAccount.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
