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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
