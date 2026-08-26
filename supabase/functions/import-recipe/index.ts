// Supabase Edge Function: lädt eine Rezept-Seite serverseitig (Browser kann
// wegen CORS nicht direkt auf fremde Seiten zugreifen), extrahiert die
// eingebetteten Rezeptdaten und liefert daraus vorausgefüllte Felder für das
// Rezept-Formular zurück.
//
// Unterstützt zwei Auszeichnungsformen für schema.org/Recipe:
// 1. JSON-LD (<script type="application/ld+json">) — der heute übliche
//    Standard, wird zuerst versucht.
// 2. Microdata (itemprop-Attribute direkt im HTML) — älterer Standard, den
//    manche Seiten (v. a. ältere WordPress-Themes) noch statt/zusätzlich zu
//    JSON-LD einsetzen. Wird nur als Treffer gewertet, wenn sich daraus
//    sowohl ein Titel als auch mindestens eine Zutat gewinnen lassen — sonst
//    bräuchte man Vertrauen in Seiten-Fragmente, die eigentlich zu einem
//    anderen schema.org-Typ gehören (z. B. Kommentare, verwandte Artikel).
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
  servings: number | null
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
        // Browserähnlicher User-Agent statt eines selbst-identifizierenden
        // Bot-Strings — manche Seiten mit einfachem Bot-Blocking lehnen
        // unbekannte/verdächtige User-Agents sonst pauschal ab.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
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
  return extractFromJsonLd(html) ?? extractFromMicrodata(html)
}

// ---------------------------------------------------------------------------
// JSON-LD (schema.org/Recipe)
// ---------------------------------------------------------------------------

function extractFromJsonLd(html: string): ParsedRecipe | null {
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
    if (recipeNode) return mapJsonLdRecipe(recipeNode)
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

function mapJsonLdRecipe(node: Record<string, unknown>): ParsedRecipe {
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
    servings: extractYield(node.recipeYield),
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

// recipeYield ist laut Spezifikation entweder eine Zahl/Zahl-als-String
// ("4"), ein beschreibender String ("4 Portionen", "4-6 servings") oder ein
// Array davon (mehrere Yield-Angaben, z. B. Personen- und Stück-Angabe
// gleichzeitig) — hier die erste plausible Zahl daraus extrahieren.
function extractYield(value: unknown): number | null {
  const candidates = Array.isArray(value) ? value : [value]
  for (const candidate of candidates) {
    const num = extractNumber(candidate)
    if (num != null && num > 0) return num
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

// ---------------------------------------------------------------------------
// Microdata (schema.org/Recipe über itemprop-Attribute im HTML)
// ---------------------------------------------------------------------------

// Nur als Treffer werten, wenn sich sowohl ein Titel als auch mindestens
// eine Zutat finden lassen — einzelne itemprop-Fragmente ohne diesen Kontext
// gehören zu oft zu unrelated Inhalten (Kommentare, verwandte Artikel,
// andere schema.org-Typen auf derselben Seite), um sie blind zu übernehmen.
function extractFromMicrodata(html: string): ParsedRecipe | null {
  const title = extractItemprop(html, 'name')[0] ?? extractItemprop(html, 'headline')[0] ?? null
  const ingredients = [
    ...extractItemprop(html, 'recipeIngredient'),
    ...extractItemprop(html, 'ingredients'), // ältere/inoffizielle Schreibweise
  ]

  if (!title || ingredients.length === 0) return null

  const description = extractItemprop(html, 'description')[0] ?? ''
  const instructionSteps = [
    ...extractItemprop(html, 'recipeInstructions'),
    ...extractItemprop(html, 'step'),
  ]
  const category = extractItemprop(html, 'recipeCategory')[0] ?? ''
  const yieldValue = extractItemprop(html, 'recipeYield')[0] ?? null

  return {
    title,
    description,
    kcal: extractNumber(extractItemprop(html, 'calories')[0]) ?? 0,
    protein_g: extractNumber(extractItemprop(html, 'proteinContent')[0]) ?? 0,
    carbs_g: extractNumber(extractItemprop(html, 'carbohydrateContent')[0]) ?? 0,
    fat_g: extractNumber(extractItemprop(html, 'fatContent')[0]) ?? 0,
    ingredients: dedupe(ingredients),
    instructions: dedupe(instructionSteps).join('\n'),
    meal_type: guessMealType(category),
    servings: yieldValue != null ? extractYield(yieldValue) : null,
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))]
}

// Findet alle Elemente mit dem angegebenen itemprop-Wert und liefert deren
// Textinhalt (bei <meta>/<link> stattdessen den content/href-Attributwert).
// Bewusst regex-basiert statt mit einem HTML-Parser, um die Funktion ohne
// externe Abhängigkeiten deploybar zu halten — das ist ein Best-Effort-
// Ansatz, kein vollständiger HTML-Parser, funktioniert aber zuverlässig
// genug für die typische, flache Verschachtelung von Rezept-Markup.
function extractItemprop(html: string, itemprop: string): string[] {
  const results: string[] = []
  const openTagRe = new RegExp(
    `<([a-zA-Z0-9]+)((?:\\s+[a-zA-Z0-9_:-]+(?:=(?:"[^"]*"|'[^']*'))?)*?\\s+itemprop=["']${itemprop}["'](?:\\s+[a-zA-Z0-9_:-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\\s*/?>`,
    'gi',
  )
  let match: RegExpExecArray | null
  while ((match = openTagRe.exec(html))) {
    const tagName = match[1]
    const fullOpenTag = match[0]

    const contentAttrMatch = fullOpenTag.match(/\scontent=["']([^"']*)["']/i)
    if (/^meta$/i.test(tagName) && contentAttrMatch) {
      const value = decodeEntities(contentAttrMatch[1]).trim()
      if (value) results.push(value)
      continue
    }

    const startIdx = match.index + fullOpenTag.length
    const closeRe = new RegExp(`</${tagName}\\s*>`, 'i')
    const rest = html.slice(startIdx)
    const closeMatch = closeRe.exec(rest)
    const innerHtml = closeMatch ? rest.slice(0, closeMatch.index) : rest.slice(0, 2000)
    const text = stripTags(innerHtml).trim()
    if (text) results.push(text)
  }
  return results
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim()
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  szlig: 'ß',
  euro: '€',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, code: string) => {
    if (code[0] === '#') {
      const codePoint = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity
    }
    return NAMED_ENTITIES[code] ?? entity
  })
}
