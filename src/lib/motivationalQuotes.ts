import type { TFunction } from 'i18next'

export function pickRandomQuote(t: TFunction): string {
  const quotes = t('quotes', { returnObjects: true }) as string[]
  return quotes[Math.floor(Math.random() * quotes.length)]
}
