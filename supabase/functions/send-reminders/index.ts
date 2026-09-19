// Supabase Edge Function: von pg_cron alle 15 Minuten aufgerufen (siehe
// supabase/add_push_notifications_cron.sql). Ermittelt pro Nutzer:in, ob
// gerade eine Erinnerung fällig ist (Wasser, Fasten-Ende, Mahlzeit,
// Gewicht), und verschickt sie per Web Push an alle registrierten Geräte.
//
// Läuft mit dem Service-Role-Key, weil quer über alle Nutzer:innen gelesen
// werden muss (RLS würde das sonst verhindern).
//
// Benötigte Secrets:
//   supabase secrets set VAPID_PUBLIC_KEY=...
//   supabase secrets set VAPID_PRIVATE_KEY=...
//   supabase secrets set VAPID_SUBJECT=mailto:deine@adresse.de
//   supabase secrets set CRON_SECRET=...
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sind von der Plattform automatisch
// gesetzt.
//
// Deploy: supabase functions deploy send-reminders
// (normale JWT-Prüfung bleibt aktiv — pg_cron schickt den Anon-Key als
// Bearer-Token mit, siehe add_push_notifications_cron.sql; CRON_SECRET ist
// eine zusätzliche, eigene Absicherung dieser konkreten Function)

import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const WATER_THROTTLE_MS = 3 * 60 * 60 * 1000
const WEIGHT_THROTTLE_MS = 6 * 24 * 60 * 60 * 1000
const FASTING_LOOKAHEAD_MS = 15 * 60 * 1000

type Profile = {
  id: string
  timezone: string
  notify_water: boolean
  notify_fasting_end: boolean
  notify_meal: boolean
  notify_weight: boolean
  daily_water_goal_ml: number
}

type NotificationState = { user_id: string; kind: string; last_sent_at: string; context: string | null }

Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:kontakt@nellicious.org',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const now = new Date()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, timezone, notify_water, notify_fasting_end, notify_meal, notify_weight, daily_water_goal_ml')
    .or('notify_water.eq.true,notify_fasting_end.eq.true,notify_meal.eq.true,notify_weight.eq.true')

  const { data: states } = await supabase.from('notification_state').select('user_id, kind, last_sent_at, context')
  const stateByKey = new Map<string, NotificationState>()
  for (const s of states ?? []) stateByKey.set(`${s.user_id}:${s.kind}`, s)

  let sentCount = 0

  for (const profile of (profiles ?? []) as Profile[]) {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', profile.id)
    if (!subscriptions || subscriptions.length === 0) continue

    const todayLocal = localDateString(now, profile.timezone)
    const due: { kind: string; title: string; body: string; context: string | null }[] = []

    if (profile.notify_water) {
      const hour = localHour(now, profile.timezone)
      if (hour >= 8 && hour <= 20) {
        const state = stateByKey.get(`${profile.id}:water`)
        const throttled = state && now.getTime() - new Date(state.last_sent_at).getTime() < WATER_THROTTLE_MS
        if (!throttled) {
          const { data: waterLog } = await supabase
            .from('water_logs')
            .select('amount_ml, updated_at')
            .eq('user_id', profile.id)
            .eq('log_date', todayLocal)
            .maybeSingle()
          const amount = waterLog?.amount_ml ?? 0
          const lastLoggedRecently =
            waterLog?.updated_at && now.getTime() - new Date(waterLog.updated_at).getTime() < WATER_THROTTLE_MS
          if (amount < profile.daily_water_goal_ml && !lastLoggedRecently) {
            due.push({
              kind: 'water',
              title: '💧 Zeit für ein Glas Wasser',
              body: 'Du hast dein Wasserziel für heute noch nicht erreicht.',
              context: null,
            })
          }
        }
      }
    }

    if (profile.notify_fasting_end) {
      const { data: session } = await supabase
        .from('fasting_sessions')
        .select('id, started_at, target_hours')
        .eq('user_id', profile.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (session) {
        const endsAt = new Date(session.started_at).getTime() + session.target_hours * 60 * 60 * 1000
        const state = stateByKey.get(`${profile.id}:fasting_end`)
        const alreadyNotified = state?.context === session.id
        if (!alreadyNotified && endsAt > now.getTime() && endsAt - now.getTime() <= FASTING_LOOKAHEAD_MS) {
          due.push({
            kind: 'fasting_end',
            title: '⏱️ Dein Fasten endet gleich',
            body: 'Noch etwa 15 Minuten, dann ist dein Fasten-Fenster vorbei.',
            context: session.id,
          })
        }
      }
    }

    if (profile.notify_meal) {
      const hour = localHour(now, profile.timezone)
      if (hour >= 20 && hour <= 21) {
        const state = stateByKey.get(`${profile.id}:meal`)
        const alreadyToday = state?.context === todayLocal
        if (!alreadyToday) {
          const { data: lastMeal } = await supabase
            .from('meal_logs')
            .select('logged_at')
            .eq('user_id', profile.id)
            .order('logged_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          const loggedToday = lastMeal && localDateString(new Date(lastMeal.logged_at), profile.timezone) === todayLocal
          if (!loggedToday) {
            due.push({
              kind: 'meal',
              title: '🍽️ Schon etwas gegessen?',
              body: 'Vergiss nicht, deine Mahlzeiten von heute einzutragen.',
              context: todayLocal,
            })
          }
        }
      }
    }

    if (profile.notify_weight) {
      const hour = localHour(now, profile.timezone)
      if (hour >= 8 && hour <= 9) {
        const state = stateByKey.get(`${profile.id}:weight`)
        const throttled = state && now.getTime() - new Date(state.last_sent_at).getTime() < WEIGHT_THROTTLE_MS
        if (!throttled) {
          const { data: lastWeight } = await supabase
            .from('weight_logs')
            .select('log_date')
            .eq('user_id', profile.id)
            .order('log_date', { ascending: false })
            .limit(1)
            .maybeSingle()
          const daysSince = lastWeight ? daysBetween(lastWeight.log_date, todayLocal) : null
          // Nur erinnern, wer die Gewichtserfassung schon einmal genutzt hat
          // (daysSince !== null) — sonst würden auch Nutzer:innen genervt,
          // die dieses Feature bewusst nie verwenden.
          if (daysSince !== null && daysSince >= 7) {
            due.push({
              kind: 'weight',
              title: '⚖️ Zeit fürs Wiegen',
              body: 'Du hast schon länger kein Gewicht mehr eingetragen.',
              context: null,
            })
          }
        }
      }
    }

    for (const reminder of due) {
      let anySucceeded = false
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: reminder.title, body: reminder.body, tag: reminder.kind, url: '/Nellicious/' }),
          )
          anySucceeded = true
          sentCount++
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          } else {
            console.error('Push fehlgeschlagen:', profile.id, reminder.kind, err)
          }
        }
      }
      if (anySucceeded) {
        await supabase
          .from('notification_state')
          .upsert(
            { user_id: profile.id, kind: reminder.kind, last_sent_at: now.toISOString(), context: reminder.context },
            { onConflict: 'user_id,kind' },
          )
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

function localDateString(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(
    date,
  )
  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  const d = parts.find((p) => p.type === 'day')!.value
  return `${y}-${m}-${d}`
}

function localHour(date: Date, timeZone: string): number {
  const value = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(date)
  return Number(value)
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00Z`).getTime()
  const to = new Date(`${toDateStr}T00:00:00Z`).getTime()
  return Math.round((to - from) / (24 * 60 * 60 * 1000))
}
