import { useEffect, useMemo, useState } from 'react'
import { GERMAN_FOODS } from './germanFoodDatabase'

export type FoodCategory = 'fisch' | 'meeresfruechte'

export type FoodSearchResult = {
  id: string
  name: string
  kcal100g: number
  protein100g: number
  carbs100g: number
  fat100g: number
  category?: FoodCategory
}

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const MAX_LOCAL_RESULTS = 8

// Viele Fischarten (Lachs, Kabeljau, Forelle, ...) und Meeresfrüchte
// (Garnelen, Muscheln, Tintenfisch, ...) enthalten das jeweilige Suchwort
// nirgends im Namen. Eine Suche nach "Fisch"/"Meeresfrüchte" soll trotzdem
// alle als solche kategorisierten Einträge finden.
const CATEGORY_WORDS: Record<FoodCategory, string[]> = {
  fisch: ['fisch', 'fish'],
  meeresfruechte: ['meeresfrüchte', 'meeresfruechte', 'seafood'],
}

function matchedCategory(q: string): FoodCategory | undefined {
  return (Object.keys(CATEGORY_WORDS) as FoodCategory[]).find((cat) =>
    CATEGORY_WORDS[cat].some((w) => w.startsWith(q) || q.startsWith(w)),
  )
}

// Höherer Wert = relevanter. 0 = kein Treffer. Namen sind kommagetrennt
// ("Ei, Huhn", "Reis, weiß, roh"), daher zählt auch der Wortanfang nach
// einem Komma/Leerzeichen als "beginnt mit", nicht nur der Namensanfang.
function matchScore(name: string, query: string): number {
  if (name === query) return 3
  if (name.startsWith(query)) return 2
  if (name.split(/[\s,]+/).some((word) => word.startsWith(query))) return 1
  if (name.includes(query)) return 0.5
  return 0
}

type OffProduct = {
  code: string
  product_name?: string
  nutriments?: Record<string, number>
}

export function useFoodSearch(query: string) {
  const [remoteResults, setRemoteResults] = useState<FoodSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const trimmed = query.trim()

  // Kuratierte Liste gängiger deutscher Lebensmittel — Open Food Facts ist
  // primär eine Barcode-Datenbank für Markenprodukte und bei generischen
  // Lebensmitteln (Reis, Gemüse, Fleisch roh, ...) für den deutschen Markt
  // oft lückenhaft. Lokale Treffer werden bevorzugt angezeigt.
  //
  // Reine Teilstring-Suche + harte Anzeigegrenze (MAX_LOCAL_RESULTS) reicht
  // nicht: Bei kurzen Suchbegriffen wie "Ei" gibt es Dutzende zufällige
  // Teilstring-Treffer (Reis, Weizen, Weißkohl, ...), die den eigentlich
  // gesuchten Eintrag ("Ei, Huhn") aus den ersten 8 Plätzen verdrängen.
  // Treffer werden deshalb nach Relevanz sortiert, bevor gekürzt wird.
  const localResults = useMemo(() => {
    if (trimmed.length < 2) return []
    const q = trimmed.toLowerCase()
    const scored = GERMAN_FOODS.map((f) => ({ food: f, score: matchScore(f.name.toLowerCase(), q) }))

    const category = matchedCategory(q)
    if (category) {
      // Kategorie-Treffer sind hier absichtlich nicht auf MAX_LOCAL_RESULTS
      // begrenzt, da bei z.B. "Fisch" gezielt eine vollständige Übersicht
      // aller Fischarten gewünscht ist, nicht nur die ersten 8 Treffer.
      const categoryMatches = scored
        .filter((r) => r.food.category === category)
        .sort((a, b) => a.food.name.localeCompare(b.food.name))
      const otherMatches = scored
        .filter((r) => r.score > 0 && r.food.category !== category)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_LOCAL_RESULTS)
      return [...categoryMatches, ...otherMatches].map((r) => r.food)
    }

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LOCAL_RESULTS)
      .map((r) => r.food)
  }, [trimmed])

  useEffect(() => {
    if (trimmed.length < 2) {
      setRemoteResults([])
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const url = `${OFF_SEARCH_URL}?search_terms=${encodeURIComponent(trimmed)}&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,nutriments`
        const res = await fetch(url, { signal: controller.signal })
        const data: { products?: OffProduct[] } = await res.json()
        const products = (data.products ?? [])
          .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
          .map((p) => ({
            id: p.code,
            name: p.product_name!,
            kcal100g: Math.round(p.nutriments!['energy-kcal_100g']),
            protein100g: Math.round(p.nutriments!['proteins_100g'] ?? 0),
            carbs100g: Math.round(p.nutriments!['carbohydrates_100g'] ?? 0),
            fat100g: Math.round(p.nutriments!['fat_100g'] ?? 0),
          }))
        setRemoteResults(products)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError(true)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [trimmed])

  const localNames = new Set(localResults.map((r) => r.name.toLowerCase()))
  const results = [...localResults, ...remoteResults.filter((r) => !localNames.has(r.name.toLowerCase()))]

  return { results, loading, error }
}
