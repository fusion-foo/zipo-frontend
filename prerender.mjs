// 预渲染脚本（SSG）：对每个 (locale, page) 生成静态 HTML
//
// 架构：
// 1. vite build → dist/index.html（模板）
// 2. vite build --ssr → dist-server/entry-server.js
// 3. 对每个 (locale, page) 调用 render() 产出真实 HTML
// 4. 生成 sitemap.xml + hreflang 备用链接
//
// 生产部署：Cloudflare Pages（静态托管，零服务端运行时）
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(root, 'dist')

// 1) 客户端构建
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.log('[prerender] client build missing, running vite build...')
  execSync('npx vite build', { cwd: root, stdio: 'inherit' })
}

// 2) SSR 入口构建
execSync('npx vite build --ssr src/entry-server.tsx --outDir dist-server', {
  cwd: root,
  stdio: 'inherit',
})

const entry = path.join(root, 'dist-server/entry-server.js')
const mod = await import(entry)
const { targets, render, pageMeta, SITE } = mod

// 3) 渲染每个页面
let count = 0
for (const [locale, page] of targets) {
  const meta = pageMeta(locale, page)
  const urlPath = meta.canonical.replace(SITE, '')
  const outFile = path.join(dist, urlPath.replace(/^\//, ''), 'index.html')
  fs.mkdirSync(path.dirname(outFile), { recursive: true })

  const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  const html = buildPage(template, meta, render(locale, page))
  fs.writeFileSync(outFile, html)
  count++
}

// 4) 生成 sitemap.xml
const allUrls = targets.map(([locale, page]) => pageMeta(locale, page))
const sitemap = buildSitemap(allUrls)
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)

// 5) 生成 robots.txt
fs.writeFileSync(path.join(dist, 'robots.txt'), buildRobots())

console.log(`[prerender] ✅ ${count} pages rendered + sitemap.xml + robots.txt`)

// ─── 页面构建 ─────────────────────────────────────────────────
function buildPage(template, meta, bodyHtml) {
  // 注入 <title> / <meta> / <link> / <html lang>
  let page = template
  page = page.replace('<html lang="en">', `<html lang="${meta.langCode}"${meta.locale === 'fa' ? ' dir="rtl"' : ''}>`)
  page = page.replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`)
  page = page.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${meta.description}">`)

  // hreflang alternates
  const altLinks = meta.hreflang.map(h =>
    `<link rel="alternate" hreflang="${h.hreflang}" href="${h.href}">`
  ).join('\n    ')
  page = page.replace('</head>', `    ${altLinks}\n    <link rel="canonical" href="${meta.canonical}">\n    <link rel="alternate" hreflang="x-default" href="${meta.xDefault}">\n  </head>`)

  // 注入 SSR body
  page = page.replace('<div id="app"></div>', `<div id="app">${bodyHtml}</div>`)

  return page
}

// ─── sitemap.xml ───────────────────────────────────────────────
function buildSitemap(urls) {
  const entries = urls.map(meta => `  <url>
    <loc>${meta.canonical}</loc>
${meta.hreflang.map(h => `    <xhtml:link rel="alternate" hreflang="${h.hreflang}" href="${h.href}">`).join('\n')}
  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`
}

// ─── robots.txt ───────────────────────────────────────────────
function buildRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`
}
