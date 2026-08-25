import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme, type ThemePreference } from '../lib/theme'
import { useFontSize, type FontSizePreference } from '../lib/fontSize'
import { useLanguage, SUPPORTED_LANGUAGES, type Language } from '../lib/useLanguage'

export function DarstellungPage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { fontSize, setFontSize } = useFontSize()
  const { language, setLanguage } = useLanguage()

  const LANGUAGE_LABELS: Record<Language, string> = {
    de: t('settings.languageGerman'),
    en: t('settings.languageEnglish'),
  }

  const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ]

  const FONT_SIZE_OPTIONS: { value: FontSizePreference; label: string }[] = [
    { value: 'normal', label: t('settings.fontSizeNormal') },
    { value: 'gross', label: t('settings.fontSizeLarge') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/mehr"
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-muted hover:text-text"
        >
          {t('common.back')}
        </Link>
      </div>
      <h1 className="font-display font-bold text-2xl">{t('settings.title')}</h1>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm text-text-muted">{t('settings.design')}</span>
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-primary text-on-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm text-text-muted">{t('settings.language')}</span>
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                language === lang ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm text-text-muted">{t('settings.fontSize')}</span>
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1 w-fit">
          {FONT_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFontSize(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                fontSize === option.value
                  ? 'bg-primary text-on-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted">{t('settings.fontSizeHint')}</span>
      </div>
    </div>
  )
}
