const LEADING_NUMBER = /^(\d+(?:[.,]\d+)?)(\s*.*)$/

function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 100) / 100
  return String(rounded).replace('.', ',')
}

/**
 * Scales the leading quantity of an ingredient string (e.g. "400 g Kichererbsen (Dose)")
 * by `factor`. Ingredients without a leading number (e.g. "Salz, Pfeffer") are left as-is.
 */
export function scaleIngredient(ingredient: string, factor: number): string {
  if (factor === 1) return ingredient
  const match = ingredient.match(LEADING_NUMBER)
  if (!match) return ingredient
  const amount = parseFloat(match[1].replace(',', '.'))
  return `${formatAmount(amount * factor)}${match[2]}`
}
