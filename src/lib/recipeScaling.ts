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

const NUMBER_TOKEN = String.raw`\d+(?:[.,]\d+)?|[½⅓⅔¼¾⅕⅙⅛]`
const LEADING_AMOUNT_RE = new RegExp(`^(${NUMBER_TOKEN})(\\s*[-–]\\s*(${NUMBER_TOKEN}))?`)

function parseToken(token: string): number | null {
  if (token in FRACTIONS) return FRACTIONS[token]
  const n = Number(token.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function formatNumber(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return String(rounded).replace('.', ',')
}

// Skaliert nur die führende Mengenangabe einer Zutatenzeile (inkl. einfacher
// Bereiche wie "2-3" und gängiger Bruch-Zeichen wie "½"). Zeilen ohne
// erkennbare Zahl am Anfang ("Salz nach Geschmack") bleiben unverändert —
// Zutaten sind Freitext, das lässt sich nicht zuverlässig auflösen.
export function scaleIngredientLine(line: string, factor: number): string {
  if (factor === 1) return line
  const leadingWs = line.match(/^\s*/)?.[0] ?? ''
  const rest = line.slice(leadingWs.length)
  const match = rest.match(LEADING_AMOUNT_RE)
  if (!match) return line

  const first = parseToken(match[1])
  if (first == null) return line

  let replacement = formatNumber(first * factor)
  if (match[3]) {
    const second = parseToken(match[3])
    if (second != null) replacement = `${replacement}–${formatNumber(second * factor)}`
  }

  return `${leadingWs}${replacement}${rest.slice(match[0].length)}`
}

export function scaleMacro(value: number, factor: number): number {
  return Math.round(value * factor)
}
