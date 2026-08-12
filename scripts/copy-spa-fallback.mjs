// GitHub Pages serves static files only — a direct load or refresh on a
// client-side route like /Nellicious/plan has no matching file and gets a
// real 404, before the SPA's router ever runs. Copying the built index.html
// to 404.html is the standard GitHub Pages workaround: GH Pages serves that
// file for any unmatched path, and react-router then takes over client-side.
import { copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'))
