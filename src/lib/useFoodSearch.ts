import { useEffect, useState } from 'react'

export type FoodSearchResult = {
  id: string
  name: string
  kcal100g: number
  protein100g: number
  carbs100g: number
  fat100g: number
}

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'

type OffProduct = {
  code: string
  product_name?: string
  nutriments?: Record<string, number>
}

export function useFoodSearch(query: string) {
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
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
        setResults(products)
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
  }, [query])

  return { results, loading, error }
}
