import { useCallback, useEffect, useRef, useState } from 'react'

// Hält den Gerätebildschirm wach (z. B. für einen "Kochmodus" beim Ablesen
// eines Rezepts), solange `active` true ist. Der Wake Lock wird vom Browser
// automatisch freigegeben, sobald der Tab in den Hintergrund wechselt — beim
// Zurückkehren wird er hier automatisch erneut angefordert, damit der Modus
// aktiv bleibt.
export function useWakeLock() {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [active, setActive] = useState(false)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async () => {
    if (!supported) return
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      sentinelRef.current = sentinel
      sentinel.addEventListener('release', () => setActive(false))
      setActive(true)
    } catch {
      setActive(false)
    }
  }, [supported])

  const release = useCallback(async () => {
    await sentinelRef.current?.release()
    sentinelRef.current = null
    setActive(false)
  }, [])

  function toggle() {
    if (active) release()
    else request()
  }

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && active && !sentinelRef.current) {
        request()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [active, request])

  // Beim Verlassen der Seite (Unmount) den Wake Lock in jedem Fall lösen,
  // damit der Bildschirm nicht dauerhaft aktiv bleibt.
  useEffect(() => {
    return () => {
      sentinelRef.current?.release()
    }
  }, [])

  return { active, supported, toggle }
}
