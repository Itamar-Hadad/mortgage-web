// Copies the calc-engine module from app/src/calc-engine into functions/src/calc-engine
// before every build, so there is exactly one source of truth (app/src/calc-engine) and
// the Cloud Function always ships whatever the client module currently contains.
// See app/src/calc-engine/README.md.
import { mkdirSync, readdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = join(here, '..', 'app', 'src', 'calc-engine')
const dest = join(here, 'src', 'calc-engine')

mkdirSync(dest, { recursive: true })
for (const name of readdirSync(source)) {
  if (name.endsWith('.test.ts') || name === 'README.md') continue
  copyFileSync(join(source, name), join(dest, name))
}