import { significantWords } from './textMatch'
import { localizeRecipeText, type Recipe } from './useRecipes'

export interface RecipeIngredientMatch {
  recipe: Recipe
  matchedCount: number
  totalCount: number
  coverage: number
}

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
// ergibt die Deckung, nach der absteigend sortiert wird. Anders als bei der
// Nährwert-Schätzung gibt es hier bewusst keine Mindest-Deckung, die Rezepte
// ganz ausblendet — schon ein einzelner Treffer (z. B. nur "Zwiebel" von
// sieben Zutaten) ist für Nutzer:innen eine brauchbare Information, die sie
// selbst gewichten können; das System soll nicht vorab entscheiden, was zu
// wenig Überschneidung ist.
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
    if (matchedCount > 0) matches.push({ recipe, matchedCount, totalCount: lines.length, coverage: matchedCount / lines.length })
  }
  return matches.sort((a, b) => b.coverage - a.coverage)
}
