import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

export type Passkey = {
  id: string
  friendlyName: string | null
  createdAt: string
}

export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

export function usePasskeys() {
  const { user } = useAuth()
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.auth.passkey.list()
    setPasskeys(
      (data ?? []).map((p) => ({
        id: p.id,
        friendlyName: p.friendly_name ?? null,
        createdAt: p.created_at,
      })),
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  async function registerPasskey() {
    const { error } = await supabase.auth.registerPasskey()
    if (error && 'code' in error && error.code === 'ERROR_CEREMONY_ABORTED') {
      return { error: null }
    }
    if (!error) await reload()
    return { error: error?.message ?? null }
  }

  async function deletePasskey(passkeyId: string) {
    const { error } = await supabase.auth.passkey.delete({ passkeyId })
    if (!error) setPasskeys((prev) => prev.filter((p) => p.id !== passkeyId))
    return { error: error?.message ?? null }
  }

  return { passkeys, loading, registerPasskey, deletePasskey }
}
