import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushPermissionState,
} from '../lib/usePushNotifications'

const TOGGLES = [
  { key: 'notify_water', label: 'notificationSettings.water', desc: 'notificationSettings.waterDesc' },
  { key: 'notify_fasting_end', label: 'notificationSettings.fastingEnd', desc: 'notificationSettings.fastingEndDesc' },
  { key: 'notify_meal', label: 'notificationSettings.meal', desc: 'notificationSettings.mealDesc' },
  { key: 'notify_weight', label: 'notificationSettings.weight', desc: 'notificationSettings.weightDesc' },
] as const

export function NotificationSettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const [permission, setPermission] = useState(getPushPermissionState)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEnable() {
    if (!user) return
    setBusy(true)
    setError(null)
    const result = await enablePushNotifications(user.id)
    if (result.error) setError(result.error)
    setPermission(getPushPermissionState())
    setBusy(false)
  }

  async function handleDisable() {
    setBusy(true)
    await disablePushNotifications()
    setPermission(getPushPermissionState())
    setBusy(false)
  }

  const active = permission === 'granted'

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

      <div>
        <h1 className="font-display font-bold text-2xl">{t('notificationSettings.title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('notificationSettings.intro')}</p>
      </div>

      {permission === 'unsupported' && (
        <p className="text-sm text-text-muted bg-surface border border-border rounded-2xl p-4">
          {t('notificationSettings.unsupported')}
        </p>
      )}

      {permission === 'denied' && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-2xl p-4">
          {t('notificationSettings.denied')}
        </p>
      )}

      {(permission === 'default' || permission === 'granted') && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {active ? t('notificationSettings.activeLabel') : t('notificationSettings.inactiveLabel')}
            </p>
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
          </div>
          <button
            type="button"
            onClick={active ? handleDisable : handleEnable}
            disabled={busy}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
              active ? 'bg-surface-2 border border-border text-text-muted hover:text-text' : 'bg-primary text-on-primary'
            }`}
          >
            {busy ? '…' : active ? t('notificationSettings.disable') : t('notificationSettings.enable')}
          </button>
        </div>
      )}

      {profile && (
        <div className={`flex flex-col gap-2 ${active ? '' : 'opacity-50 pointer-events-none'}`}>
          {TOGGLES.map(({ key, label, desc }) => (
            <label
              key={key}
              className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium">{t(label)}</span>
                <span className="text-xs text-text-muted">{t(desc)}</span>
              </span>
              <input
                type="checkbox"
                checked={profile[key]}
                onChange={(e) => updateProfile({ [key]: e.target.checked })}
                className="shrink-0 w-5 h-5 accent-primary"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
