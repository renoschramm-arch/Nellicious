import { useState } from 'react'

export type FontSizePreference = 'normal' | 'gross'

const STORAGE_KEY = 'nellicious-font-size'

export function getStoredFontSize(): FontSizePreference {
  return localStorage.getItem(STORAGE_KEY) === 'gross' ? 'gross' : 'normal'
}

export function applyFontSize(fontSize: FontSizePreference) {
  document.documentElement.setAttribute('data-font-size', fontSize)
}

export function setStoredFontSize(fontSize: FontSizePreference) {
  localStorage.setItem(STORAGE_KEY, fontSize)
  applyFontSize(fontSize)
}

// Applied immediately on import (before React renders), wie bei theme.ts,
// damit die Seite nie kurz in normaler Größe aufblitzt.
applyFontSize(getStoredFontSize())

export function useFontSize() {
  const [fontSize, setFontSize] = useState<FontSizePreference>(getStoredFontSize)

  function selectFontSize(next: FontSizePreference) {
    setStoredFontSize(next)
    setFontSize(next)
  }

  return { fontSize, setFontSize: selectFontSize }
}
