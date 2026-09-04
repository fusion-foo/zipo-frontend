#!/usr/bin/env node
// Generate programmatic landing page slugs from PAGE definitions.
// Usage: node scripts/gen-pages.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const LOCALES = ['zh', 'zh-Hant', 'en', 'tr', 'fr', 'es', 'ko', 'ja', 'fa']

const PAGES = {
  'compress-image-to': ['20kb', '50kb', '100kb', '200kb', '500kb'],
  'compress-image-for': ['twitter', 'instagram', 'linkedin', 'wordpress', 'web'],
}

const targets: [string, string][] = []
for (const locale of LOCALES) {
  targets.push([locale, 'home'])
  for (const [page, slugs] of Object.entries(PAGES)) {
    for (const slug of slugs) {
      targets.push([locale, `${page}/${slug}`])
    }
  }
}

// Output to a JSON file for other tools to consume
const out = path.join(root, 'dist-pages.json')
fs.writeFileSync(out, JSON.stringify({ targets, localeCount: LOCALES.length, pageCount: targets.length }, null, 2))

console.log(`[gen-pages] ✅ ${targets.length} targets (${LOCALES.length} locales × pages)`)
console.log(`[gen-pages] Output: ${path.relative(root, out)}`)

// Also print sample URLs
console.log('\n[gen-pages] Sample URLs:')
for (const [locale, page] of targets.slice(0, 10)) {
  const path = page === 'home' ? `/${locale}/` : `/${locale}/${page}/`
  console.log(`  https://zipo.pics${path}`)
}
