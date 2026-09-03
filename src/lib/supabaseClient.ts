import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY müssen gesetzt sein (siehe .env.example).',
  )
}

// Passkey-Support ist bei Supabase Auth noch experimentell und muss über
// dieses Flag explizit aktiviert werden — sonst werfen alle Passkey-Methoden
// (signInWithPasskey, registerPasskey, auth.passkey.*) einen Fehler.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { experimental: { passkey: true } },
})
