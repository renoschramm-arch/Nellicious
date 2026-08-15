import { useEffect, useMemo, useState } from 'react'
import { GERMAN_FOODS } from './germanFoodDatabase'

export type FoodSearchResult = {
  id: string
  name: string
  kcal100g: number
  protein100g: number
  carbs100g: number
  fat100g: number
}

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const MAX_LOCAL_RESULTS = 8

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
  const localResults = useMemo(() => {
    if (trimmed.length < 2) return []
    const q = trimmed.toLowerCase()
    return GERMAN_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, MAX_LOCAL_RESULTS)
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
