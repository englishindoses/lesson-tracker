// Downloads the OFL text for each bundled font into src/fonts/licences.
//
// The Open Font License requires its text to be distributed with the fonts, so
// a summary table isn't enough on its own.
//
// Run with: node scripts/fetch-font-licences.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'src/fonts/licences')

const FAMILIES = {
  Quicksand: 'quicksand',
  Inter: 'inter',
  Sacramento: 'sacramento',
  'Amatic SC': 'amaticsc',
  Caveat: 'caveat',
  'Indie Flower': 'indieflower',
  'Patrick Hand': 'patrickhand',
}

mkdirSync(outDir, { recursive: true })

for (const [name, slug] of Object.entries(FAMILIES)) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${slug}/OFL.txt`
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`${name}: ${res.status} — check the licence by hand`)
    continue
  }
  writeFileSync(resolve(outDir, `${slug}-OFL.txt`), await res.text())
  console.log(`${name} -> ${slug}-OFL.txt`)
}
