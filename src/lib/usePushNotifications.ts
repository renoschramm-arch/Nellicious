import { supabase } from './supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export function getPushPermissionState(): PushPermissionState {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

// Web Push erwartet den VAPID-Public-Key als Uint8Array, Supabase/Browser
// liefern bzw. erwarten ihn aber als base64url-String.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

// Fordert die Berechtigung an (falls nötig), registriert die Push-
// Subscription beim Browser und speichert sie in Supabase. Aktualisiert
// dabei auch die im Profil hinterlegte Zeitzone, damit die
// send-reminders-Funktion Erinnerungen zur richtigen Ortszeit verschickt.
export async function enablePushNotifications(userId: string): Promise<{ error: string | null }> {
  if (!VAPID_PUBLIC_KEY) {
    return { error: 'Push-Benachrichtigungen sind serverseitig noch nicht eingerichtet.' }
  }
  if (getPushPermissionState() === 'unsupported') {
    return { error: 'Dieser Browser unterstützt keine Push-Benachrichtigungen.' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { error: 'Berechtigung wurde nicht erteilt.' }
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))

  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { error: 'Push-Subscription konnte nicht erstellt werden.' }
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) return { error: error.message }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  await supabase.from('profiles').update({ timezone }).eq('id', userId)

  return { error: null }
}

export async function disablePushNotifications(): Promise<void> {
  if (getPushPermissionState() === 'unsupported') return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}
