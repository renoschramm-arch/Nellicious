import type { FoodSearchResult } from './useFoodSearch'

type OffProductResponse = {
  status: number
  product?: {
    code: string
    product_name?: string
    nutriments?: Record<string, number>
  }
}

export async function lookupFoodByBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,nutriments`
  const res = await fetch(url)
  const data: OffProductResponse = await res.json()
  const product = data.product

  if (data.status !== 1 || !product?.product_name || product.nutriments?.['energy-kcal_100g'] == null) {
    return null
  }

  return {
    id: product.code,
    name: product.product_name,
    kcal100g: Math.round(product.nutriments['energy-kcal_100g']),
    protein100g: Math.round(product.nutriments['proteins_100g'] ?? 0),
    carbs100g: Math.round(product.nutriments['carbohydrates_100g'] ?? 0),
    fat100g: Math.round(product.nutriments['fat_100g'] ?? 0),
  }
}
