import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/theme'
import './lib/fontSize'
import './lib/i18n'
import App from './App.tsx'

// Eigene Scroll-Wiederherstellung (useScrollRestoration) übernimmt das
// Springen zur zuletzt betrachteten Position bei Zurück-Navigation — die
// native Browser-Restauration würde dem sonst in die Quere kommen.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

// Geteilte Rezept-Links zeigen auf "/?share=<id>" statt direkt auf
// "/rezept-teilen/<id>" (siehe RecipeDetailPage.tsx) — nur die echte
// Startseite liefert GitHub Pages immer mit 200 OK statt über den
// 404.html-Fallback aus, was Linkvorschau-Crawler brauchen. Die Startseite
// "/" ist aber durch ProtectedRoute geschützt und leitet nicht angemeldete
// Besucher:innen zur Landingpage um — ein Redirect danach (z. B. per
// useEffect + navigate) kommt gegen diesen Guard immer zu spät. Deshalb
// wird die URL hier, vor dem ersten Render, direkt umgeschrieben: der
// Router bekommt "/rezept-teilen/<id>" nie als "/" zu Gesicht.
const shareId = new URLSearchParams(window.location.search).get('share')
if (shareId) {
  window.history.replaceState(null, '', `${import.meta.env.BASE_URL}rezept-teilen/${shareId}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
