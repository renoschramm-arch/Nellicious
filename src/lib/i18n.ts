import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from '../locales/de.json'
import en from '../locales/en.json'

export const SUPPORTED_LANGUAGES = ['de', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

const STORAGE_KEY = 'nellicious-lang'

export function getStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'de'
}

export function setStoredLanguage(lang: Language) {
  localStorage.setItem(STORAGE_KEY, lang)
  i18n.changeLanguage(lang)
}

// Intl-Locale passend zur aktuellen Sprache — für Datums-/Zahlenformate
// außerhalb von react-i18next (Intl.DateTimeFormat, toLocaleString).
export function getIntlLocale(): string {
  return i18n.language === 'en' ? 'en-US' : 'de-DE'
}

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
})

export default i18n
