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

export function useScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') {
      const saved = scrollPositions.get(location.key)
      window.scrollTo(0, saved ?? 0)
    } else {
      window.scrollTo(0, 0)
    }

    return () => {
      scrollPositions.set(location.key, window.scrollY)
    }
  }, [location, navigationType])
}
