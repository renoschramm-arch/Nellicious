// Supabase Edge Function: löscht den Account der aufrufenden Person
// vollständig. Läuft mit dem Service-Role-Key, weil das Löschen eines
// auth.users-Datensatzes clientseitig nicht möglich ist (erfordert erhöhte
// Rechte) — auth.uid() wird trotzdem zuerst aus dem mitgeschickten JWT
// ermittelt, damit niemand ein fremdes Konto löschen kann.
//
// Alle Tabellen mit user_id/owner_id → auth.users(id) haben "on delete
// cascade" (siehe supabase/schema.sql), d. h. Profil, eigene Rezepte,
// Mahlzeiten-Einträge, Wochenplan, Fasten-Sessions und Feedback werden von
// Postgres automatisch mitgelöscht.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY sind von der
// Plattform automatisch gesetzt.
//
// Deploy: supabase functions deploy delete-account

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Nicht angemeldet.', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Identifiziert die aufrufende Person aus ihrem eigenen JWT.
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return jsonError('Nicht angemeldet.', 401)

    // Löscht das Konto mit erhöhten Rechten — absichtlich erst NACH der
    // Identifikation über das Nutzer-JWT, damit ausschließlich das eigene
    // Konto gelöscht werden kann.
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { error } = await adminClient.auth.admin.deleteUser(user.id)
    if (error) {
      console.error('Kontolöschung fehlgeschlagen:', error)
      return jsonError('Konto konnte nicht gelöscht werden.', 500)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Konto konnte nicht gelöscht werden.', 500)
  }
})

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
