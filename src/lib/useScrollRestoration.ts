import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Der Browser springt bei "Zurück" (z. B. von der Rezeptdetailseite zur
// Rezepteliste) sonst immer an den Seitenanfang, statt zur zuletzt
// betrachteten Stelle zurückzukehren — man müsste jedes Mal neu zum
// gerade angeschauten Rezept scrollen. Merkt sich die Scroll-Position pro
// Verlaufseintrag (location.key ist pro Besuch eindeutig, auch bei
// mehrfachem Besuch desselben Pfads) und stellt sie bei Zurück/Vorwärts-
// Navigation (POP) wieder her; bei normaler Navigation (Klick auf einen
// Link) wird wie gewohnt nach oben gescrollt.
const scrollPositions = new Map<string, number>()

// Seiten wie die Rezepteliste laden ihre Inhalte asynchron nach (z. B. aus
// Supabase, ohne Cache) — direkt nach der Navigation ist die Seite oft noch
// leer/kurz, sodass window.scrollTo() auf die gespeicherte Position gekappt
// wird. Deshalb wird der Scroll pro Frame erneut gesetzt, bis er greift
// (die Seite also inzwischen hoch genug gewachsen ist) oder ein Timeout
// erreicht ist.
const RESTORE_TIMEOUT_MS = 2000

export function useScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    let cancelled = false
    let frame: number

    if (navigationType === 'POP') {
      const target = scrollPositions.get(location.key) ?? 0
      const start = performance.now()
      const tryRestore = () => {
        if (cancelled) return
        window.scrollTo(0, target)
        const closeEnough = Math.abs(window.scrollY - target) < 2
        if (!closeEnough && performance.now() - start < RESTORE_TIMEOUT_MS) {
          frame = requestAnimationFrame(tryRestore)
        }
      }
      tryRestore()
    } else {
      window.scrollTo(0, 0)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      scrollPositions.set(location.key, window.scrollY)
    }
  }, [location, navigationType])
}
