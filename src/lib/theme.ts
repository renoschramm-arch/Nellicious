import { useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'nellicious-theme'

export function getStoredTheme(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export function setStoredTheme(theme: ThemePreference) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

// Applied immediately on import (before React renders) so the page never
// flashes the system theme before switching to a stored override.
applyTheme(getStoredTheme())

export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>(getStoredTheme)

  function selectTheme(next: ThemePreference) {
    setStoredTheme(next)
    setTheme(next)
  }

  return { theme, setTheme: selectTheme }
}
