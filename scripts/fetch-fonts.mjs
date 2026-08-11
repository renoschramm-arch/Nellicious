// Lädt die selbst gehosteten Schriftdateien (Domine, Work Sans, IBM Plex Mono)
// von Google Fonts herunter. Läuft automatisch vor `dev`/`build`, damit die
// Binärdateien nicht im Repo liegen müssen.
import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'fonts')

const fonts = [
  ['domine-latin.woff2', 'https://fonts.gstatic.com/s/domine/v25/L0x8DFMnlVwD4h3hu_qn.woff2'],
  ['worksans-latin.woff2', 'https://fonts.gstatic.com/s/worksans/v24/QGYsz_wNahGAdqQ43Rh_fKDp.woff2'],
  [
    'plexmono-400-latin.woff2',
    'https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q1w.woff2',
  ],
  [
    'plexmono-500-latin.woff2',
    'https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgg.woff2',
  ],
]

mkdirSync(outDir, { recursive: true })

for (const [filename, url] of fonts) {
  const dest = path.join(outDir, filename)
  if (existsSync(dest)) continue
  console.log(`Lade ${filename} …`)
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Download fehlgeschlagen für ${url}: ${res.status}`)
  }
  await pipeline(res.body, createWriteStream(dest))
}
