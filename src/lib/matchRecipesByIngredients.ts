import { significantWords } from './textMatch'
import { localizeRecipeText, type Recipe } from './useRecipes'

export interface RecipeIngredientMatch {
  recipe: Recipe
  matchedCount: number
  totalCount: number
  coverage: number
}

// Rezepte mit weniger Deckung als das werden nicht vorgeschlagen — lieber
// wenige passende Treffer als eine lange Liste kaum passender Rezepte.
const MIN_COVERAGE = 0.4

function wordsOverlap(a: string, b: string): boolean {
  return a === b || a.startsWith(b) || b.startsWith(a)
}

function lineMatchesHave(lineWords: string[], haveWordSets: string[][]): boolean {
  return haveWordSets.some((haveWords) => haveWords.some((hw) => lineWords.some((lw) => wordsOverlap(lw, hw))))
}

// Schlägt Rezepte anhand vorhandener Zutaten vor. Wortabgleich wie beim
// Nährwert-Schätzen aus der Zutatenliste (estimateNutrition.ts), hier aber
// pro Zutatenzeile nur ein Ja/Nein: enthält sie mindestens ein Wort, das zu
// einer der "vorhandenen" Zutaten passt? Der Anteil zutreffender Zeilen
// ergibt die Deckung, nach der absteigend sortiert wird.
export function matchRecipesByIngredients(
  recipes: Recipe[],
  haveIngredients: string[],
  language: string,
): RecipeIngredientMatch[] {
  const haveWordSets = haveIngredients.map(significantWords).filter((words) => words.length > 0)
  if (haveWordSets.length === 0) return []

  const matches: RecipeIngredientMatch[] = []
  for (const recipe of recipes) {
    const lines = localizeRecipeText(recipe, language).ingredients
    if (lines.length === 0) continue
    const matchedCount = lines.filter((line) => lineMatchesHave(significantWords(line), haveWordSets)).length
    const coverage = matchedCount / lines.length
    if (coverage >= MIN_COVERAGE) matches.push({ recipe, matchedCount, totalCount: lines.length, coverage })
  }
  return matches.sort((a, b) => b.coverage - a.coverage)
}
