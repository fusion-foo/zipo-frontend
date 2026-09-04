#!/usr/bin/env node
// IndexNow URL submission — tell Bing/Yandex/Naver/Seznam about your URLs.
// Google does NOT support IndexNow; use Google Search Console for Google.
//
// Usage:
//   node scripts/indexnow-push.mjs                 # push dist/sitemap.xml (after build)
//   node scripts/indexnow-push.mjs --live          # fetch live sitemap (after deploy)
//   node scripts/indexnow-push.mjs --key <hex>     # specify key explicitly
//   node scripts/indexnow-push.mjs --dry           # preview only, no request
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HOST = 'zipo.pics'
const ENDPOINT = 'https://api.indexnow.org/IndexNow'

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const opt = (f, dflt) => {
  const i = argv.indexOf(f)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt
}

function findKey() {
  const pub = path.join(root, 'public')
  for (const f of fs.readdirSync(pub)) {
    if (!f.endsWith('.txt')) continue
    const stem = f.slice(0, -4)
    if (!/^[a-f0-9]{8,128}$/.test(stem)) continue
    if (fs.readFileSync(path.join(pub, f), 'utf8').trim() === stem) return stem
  }
  return null
}

function urlsFromXml(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
}

const key = opt('--key', null) || findKey()
if (!key) {
  console.error('[indexnow] 未找到 key 文件。请在 public/ 放置 <32位十六进制>.txt，内容为 key 本身，或用 --key 指定。')
  process.exit(1)
}

let urls
if (has('--live')) {
  const res = await fetch(`https://${HOST}/sitemap.xml`)
  if (!res.ok) {
    console.error(`[indexnow] 拉取线上 sitemap 失败：HTTP ${res.status}`)
    process.exit(1)
  }
  urls = urlsFromXml(await res.text())
  console.log(`[indexnow] 来源：线上 https://${HOST}/sitemap.xml`)
} else {
  const file = path.resolve(root, opt('--file', 'dist/sitemap.xml'))
  if (!fs.existsSync(file)) {
    console.error(`[indexnow] 找不到 ${file}。先跑 npm run build，或改用 --live。`)
    process.exit(1)
  }
  urls = urlsFromXml(fs.readFileSync(file, 'utf8'))
  console.log(`[indexnow] 来源：${path.relative(root, file)}`)
}

if (!urls.length) {
  console.error('[indexnow] sitemap 里没有解析到任何 URL。')
  process.exit(1)
}

console.log(`[indexnow] key=${key}  URL 数=${urls.length}`)
if (has('--dry')) {
  for (const u of urls) console.log('  ' + u)
  process.exit(0)
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList: urls,
  }),
})

const msg = {
  200: '提交成功（key 有效，URL 已入队）',
  202: '已接受（URL 已入队，稍后抓取）',
  400: '请求格式错误',
  403: 'key 无效或 keyLocation 不匹配（确认 <key>.txt 已部署到站点根目录）',
  422: 'URL 不属于该 host，或 key 不合法',
  429: '超出配额（429）——稍后重试，或改用分批推送',
}[res.status]

console.log(`[indexnow] HTTP ${res.status} ${msg ?? ''}`)
if (res.status === 429 || res.status >= 400) {
  const body = await res.text()
  if (body) console.log('[indexnow] 响应体：' + body.slice(0, 500))
  process.exit(res.status === 429 ? 0 : 1)
}
