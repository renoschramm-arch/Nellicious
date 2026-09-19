import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

const DEFAULT_ERROR = 'Feedback konnte nicht gesendet werden. Bitte später erneut versuchen.'

export async function sendFeedback(message: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-feedback', {
    body: { message },
  })

  if (error) {
    let apiMessage: string | null = null
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json()
        if (typeof body?.error === 'string') apiMessage = body.error
      } catch {
        // Antwort war kein JSON – Standardmeldung verwenden.
      }
    }
    throw new Error(apiMessage ?? DEFAULT_ERROR)
  }
}
