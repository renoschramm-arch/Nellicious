import { GERMAN_FOODS } from './germanFoodDatabase'
import { significantWords } from './textMatch'

export interface NutritionEstimate {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  matchedCount: number
  totalCount: number
}

// Nur Einheiten mit eindeutigem Gramm-/Milliliter-Bezug werden umgerechnet.
// Stückangaben ("1 Zwiebel", "2 Zehen Knoblauch", "1 Bund Petersilie") bleiben
// bewusst unberücksichtigt, weil sich ihr Gewicht nicht zuverlässig schätzen
// lässt — lieber eine unvollständige Schätzung als eine falsche.
const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gr: 1,
  gramm: 1,
  kg: 1000,
  kilogramm: 1000,
  ml: 1,
  milliliter: 1,
  l: 1000,
  liter: 1000,
  el: 15,
  essl: 15,
  esslöffel: 15,
  tbsp: 15,
  tl: 5,
  teel: 5,
  teelöffel: 5,
  tsp: 5,
  prise: 0.3,
  prisen: 0.3,
}

const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅙': 1 / 6,
  '⅛': 0.125,
}

// "1/2 TL ..." (mit Tastatur-Schrägstrich) muss vor der reinen Ganzzahl-
// Variante stehen, sonst matcht die Alternation nur die "1" und lässt das
// "/2" (und damit die ganze Einheit dahinter) unverarbeitet stehen.
const NUMBER_TOKEN = String.raw`\d+/\d+|\d+(?:[.,]\d+)?|[½⅓⅔¼¾⅕⅙⅛]`
const LEADING_AMOUNT_RE = new RegExp(`^\\s*(${NUMBER_TOKEN})(?:\\s*[-–]\\s*(?:${NUMBER_TOKEN}))?\\s*`)
const UNIT_TOKEN_RE = /^([a-zA-ZäöüÄÖÜß]+)\.?\s+/

function parseAmountToken(token: string): number | null {
  if (token in FRACTIONS) return FRACTIONS[token]
  if (token.includes('/')) {
    const [num, den] = token.split('/').map(Number)
    return den ? num / den : null
  }
  const n = Number(token.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Zutaten mit einem verlässlichen Standardgewicht pro Stück — anders als bei
// Zwiebeln, Knoblauchzehen o. Ä., deren Größe zu stark schwankt, um sie ohne
// Gramm-/Volumenangabe seriös zu schätzen. Ei-Größe M ist EU-weit genormt
// (ca. 53–63 g), daher hier als Ausnahme mit fester ID statt Fuzzy-Suche —
// "Ei" ist als Wort zu kurz für die Wortüberlappung in findBestFoodMatch.
const PIECE_FOODS: { pattern: RegExp; gramsPerPiece: number; foodId: string }[] = [
  { pattern: /^eier?\b/i, gramsPerPiece: 58, foodId: 'local-150' },
]

interface ParsedIngredient {
  grams: number | null
  food: string
  directFoodId?: string
}

// Zerlegt eine Zutatenzeile wie "200 g Mehl" oder "2 EL Olivenöl" in Gramm
// und Lebensmittelbezeichnung. Zeilen ohne führende Zahl oder ohne
// erkennbare Gewichts-/Volumeneinheit bzw. Stückzutat aus PIECE_FOODS liefern
// `grams: null` und werden von der Schätzung ausgeschlossen.
function parseIngredientLine(line: string): ParsedIngredient {
  const amountMatch = line.match(LEADING_AMOUNT_RE)
  if (!amountMatch) return { grams: null, food: line.trim() }

  const amount = parseAmountToken(amountMatch[1])
  const rest = line.slice(amountMatch[0].length).trim()
  if (amount == null) return { grams: null, food: rest }

  const piece = PIECE_FOODS.find((p) => p.pattern.test(rest))
  if (piece) return { grams: amount * piece.gramsPerPiece, food: rest, directFoodId: piece.foodId }

  const unitMatch = rest.match(UNIT_TOKEN_RE)
  const unitToken = unitMatch ? unitMatch[1].toLowerCase().replace(/\.$/, '') : null
  const gramsPerUnit = unitToken ? UNIT_TO_GRAMS[unitToken] : undefined

  if (gramsPerUnit == null) return { grams: null, food: rest }
  return { grams: amount * gramsPerUnit, food: rest.slice(unitMatch![0].length).trim() }
}

// Zustände, die für den "roh vs. gekocht"-Vergleich als "nicht mehr roh"
// gelten — Dosen-/Glas-Ware (Kichererbsen, Mais, Bohnen, Tomaten, ...) ist
// praktisch immer bereits gegart, auch ohne das Wort "gekocht" in der Zeile.
const COOKED_RE = /gekocht|gegart|gedünstet|blanchiert|gebraten|dose|dosen|glas|konserve/i

// Sucht den am besten passenden Eintrag aus der kuratierten Lebensmittel-
// Datenbank per Wortüberlappung. Roh-Varianten werden bevorzugt, außer die
// Zutatenzeile nennt selbst einen Garzustand ("gekocht" o. ä.) — Rezept-
// Zutatenlisten geben praktisch immer Rohgewichte an.
function findBestFoodMatch(foodDescription: string) {
  const words = significantWords(foodDescription)
  if (words.length === 0) return null

  const mentionsCooked = COOKED_RE.test(foodDescription)

  let best: { food: (typeof GERMAN_FOODS)[number]; score: number } | null = null
  for (const food of GERMAN_FOODS) {
    const foodWords = significantWords(food.name)
    if (foodWords.length === 0) continue

    let score = 0
    for (const w of words) {
      if (foodWords.includes(w)) score += 2
      else if (foodWords.some((fw) => fw.startsWith(w) || w.startsWith(fw))) score += 1
    }
    if (score === 0) continue

    if (COOKED_RE.test(food.name) !== mentionsCooked) score -= 0.5

    if (!best || score > best.score) best = { food, score }
  }

  return best && best.score >= 2 ? best.food : null
}

// Schätzt kcal/Makros aus einer Zutatenliste, wenn die Quelle (z. B. beim
// Rezept-Import) keine eigenen Nährwertangaben liefert. Gibt `null` zurück,
// wenn zu wenige Zutaten zuverlässig zugeordnet werden konnten — dann lieber
// gar keine Schätzung als eine auf zu dünner Basis.
export function estimateNutritionFromIngredients(ingredients: string[]): NutritionEstimate | null {
  let kcal = 0
  let protein = 0
  let carbs = 0
  let fat = 0
  let matchedCount = 0

  for (const line of ingredients) {
    const { grams, food, directFoodId } = parseIngredientLine(line)
    if (grams == null) continue
    const match = directFoodId ? GERMAN_FOODS.find((f) => f.id === directFoodId) : findBestFoodMatch(food)
    if (!match) continue

    const factor = grams / 100
    kcal += match.kcal100g * factor
    protein += match.protein100g * factor
    carbs += match.carbs100g * factor
    fat += match.fat100g * factor
    matchedCount++
  }

  const totalCount = ingredients.length
  if (totalCount === 0 || matchedCount < 2 || matchedCount / totalCount < 0.4) return null

  return {
    kcal: Math.round(kcal),
    protein_g: Math.round(protein),
    carbs_g: Math.round(carbs),
    fat_g: Math.round(fat),
    matchedCount,
    totalCount,
  }
}
