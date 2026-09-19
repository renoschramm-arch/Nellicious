import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sendFeedback } from '../lib/useFeedback'

const MAX_LENGTH = 2000

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      await sendFeedback(message.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('feedback.error'))
    } finally {
      setSending(false)
    }
  }

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
          <h2 className="font-display font-semibold text-lg">{t('feedback.title')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-sm" aria-label={t('feedback.close')}>
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          {sent ? (
            <p className="text-sm text-text-muted leading-relaxed">{t('feedback.thanks')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-sm text-text-muted leading-relaxed">{t('feedback.paragraph')}</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                rows={5}
                placeholder={t('feedback.placeholder')}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                maxLength={MAX_LENGTH}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="bg-primary text-on-primary font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50"
              >
                {sending ? t('feedback.sending') : t('feedback.send')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
