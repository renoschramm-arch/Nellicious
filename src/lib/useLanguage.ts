import { useState } from 'react'
import i18n, { SUPPORTED_LANGUAGES, getStoredLanguage, setStoredLanguage, type Language } from './i18n'

export { SUPPORTED_LANGUAGES }
export type { Language }

// Analog zu useTheme/useFontSize — hält den lokalen State synchron mit dem
// in localStorage/i18next gespeicherten Wert, damit ein Wechsel sofort in
// der ganzen App (inkl. Datums-/Zahlenformaten) wirkt.
export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage)

  function selectLanguage(next: Language) {
    setStoredLanguage(next)
    setLanguageState(next)
  }

  return { language, setLanguage: selectLanguage }
}

// Für Stellen außerhalb von React-Komponenten, die nur den aktuellen Wert lesen wollen.
export function currentLanguage(): Language {
  return i18n.language === 'en' ? 'en' : 'de'
}
