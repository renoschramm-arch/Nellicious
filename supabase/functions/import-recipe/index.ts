// Supabase Edge Function: lädt eine Rezept-Seite serverseitig (Browser kann
// wegen CORS nicht direkt auf fremde Seiten zugreifen), extrahiert die
// eingebetteten schema.org/Recipe-Daten (JSON-LD) und liefert daraus
// vorausgefüllte Felder für das Rezept-Formular zurück.
//
// Deploy: supabase functions deploy import-recipe

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_HTML_BYTES = 3_000_000 // Obergrenze gegen Missbrauch/übergroße Antworten
const FETCH_TIMEOUT_MS = 8000

type MealType = 'fruehstueck' | 'mittag' | 'abend' | 'snack'

type ParsedRecipe = {
  title: string
  description: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  ingredients: string[]
  instructions: string
  meal_type: MealType
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { url } = await req.json()
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return jsonError('Ungültige URL.', 400)
    }

    const html = await fetchHtml(url)
    const recipe = extractRecipe(html)
    if (!recipe) {
      return jsonError('Kein Rezept auf dieser Seite gefunden.', 422)
    }

    return new Response(JSON.stringify(recipe), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Import fehlgeschlagen.', 500)
  }
})

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NelliciousImport/1.0)',
        Accept: 'text/html',
      },
    })
    if (!res.ok) {
      throw new Error(`Seite konnte nicht geladen werden (Status ${res.status}).`)
    }
    const reader = res.body?.getReader()
    if (!reader) return await res.text()

    let received = 0
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      if (received > MAX_HTML_BYTES) {
        throw new Error('Die Seite ist zu groß, um sie zu importieren.')
      }
      chunks.push(value)
    }
    return new TextDecoder().decode(concatChunks(chunks))
  } finally {
    clearTimeout(timeout)
  }
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function extractRecipe(html: string): ParsedRecipe | null {
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptRe.exec(html))) {
    const raw = match[1].trim()
    if (!raw) continue
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      continue
    }
    const recipeNode = findRecipeNode(data)
    if (recipeNode) return mapRecipe(recipeNode)
  }
  return null
}

// JSON-LD kann ein einzelnes Objekt, ein Array mehrerer Knoten oder ein
// @graph mit verschachtelten Knoten sein (z. B. Yoast SEO auf WordPress) —
// hier rekursiv nach einem Knoten vom Typ "Recipe" suchen.
function findRecipeNode(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item)
      if (found) return found
    }
    return null
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const type = obj['@type']
    const types = Array.isArray(type) ? type : [type]
    if (types.includes('Recipe')) return obj
    if (Array.isArray(obj['@graph'])) {
      const found = findRecipeNode(obj['@graph'])
      if (found) return found
    }
  }
  return null
}

function mapRecipe(node: Record<string, unknown>): ParsedRecipe {
  const nutrition = (node.nutrition ?? {}) as Record<string, unknown>

  return {
    title: asString(node.name) ?? 'Importiertes Rezept',
    description: asString(node.description) ?? '',
    kcal: extractNumber(nutrition.calories) ?? 0,
    protein_g: extractNumber(nutrition.proteinContent) ?? 0,
    carbs_g: extractNumber(nutrition.carbohydrateContent) ?? 0,
    fat_g: extractNumber(nutrition.fatContent) ?? 0,
    ingredients: asStringArray(node.recipeIngredient),
    instructions: extractInstructions(node.recipeInstructions),
    meal_type: guessMealType(asString(node.recipeCategory) ?? ''),
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
  }
  if (typeof value === 'string') return [value.trim()]
  return []
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number') return Math.round(value)
  if (typeof value === 'string') {
    const match = value.match(/[\d.,]+/)
    if (match) {
      const num = parseFloat(match[0].replace(',', '.'))
      if (!Number.isNaN(num)) return Math.round(num)
    }
  }
  return null
}

// recipeInstructions kann String, String[], HowToStep[] oder verschachtelte
// HowToSection[] mit itemListElement sein — hier zu einem Fließtext
// zusammenführen, ein Schritt pro Zeile.
function extractInstructions(value: unknown): string {
  const steps: string[] = []

  function walk(node: unknown) {
    if (typeof node === 'string') {
      steps.push(node.trim())
    } else if (Array.isArray(node)) {
      node.forEach(walk)
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if (typeof obj.text === 'string') {
        steps.push(obj.text.trim())
      } else if (Array.isArray(obj.itemListElement)) {
        walk(obj.itemListElement)
      }
    }
  }

  walk(value)
  return steps.filter(Boolean).join('\n')
}

function guessMealType(category: string): MealType {
  const lower = category.toLowerCase()
  if (/frühstück|breakfast/.test(lower)) return 'fruehstueck'
  if (/snack|vorspeise|appetizer|dessert|nachspeise|kuchen/.test(lower)) return 'snack'
  if (/abendessen|dinner/.test(lower)) return 'abend'
  return 'mittag'
}
