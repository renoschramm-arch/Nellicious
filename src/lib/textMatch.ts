// Gemeinsame Wortabgleich-Hilfsfunktion für freien Zutatentext — genutzt
// sowohl beim Nährwert-Schätzen (estimateNutrition.ts) als auch beim
// Rezeptvorschlag anhand vorhandener Zutaten (matchRecipesByIngredients.ts).
const STOPWORDS = new Set([
  'frisch',
  'frische',
  'frischer',
  'fein',
  'grob',
  'gehackt',
  'gehackte',
  'gewürfelt',
  'geraspelt',
  'gerieben',
  'geriebene',
  'gemahlen',
  'klein',
  'kleine',
  'groß',
  'große',
  'nach',
  'geschmack',
  'optional',
  'oder',
  'und',
  'ca',
  'etwa',
])

export function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[(),.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}
