/**
 * SSG 入口服务端渲染（entry-server.tsx）
 *
 * 这是 SSG 架构的核心：把 React 组件渲染成 HTML 字符串。
 * prerender.mjs 调用此模块对每个 (locale, page) 组合渲染一次，
 * 产出纯静态 HTML（零运行时服务端依赖）。
 *
 * 开源版简化：只保留 i18n + 落地页 + SEO meta 的渲染管线，
 * 剔除 WASM 压缩器 / ML 模型 / 后端 API 等 zipo.pics 专有逻辑。
 */
import { renderToString } from 'react-dom/server'
import React from 'react'
import App from './App'
import { I18nProvider } from './i18n'

/** 渲染单个页面为 HTML 字符串 */
export function render(locale: string, page: string): string {
  const html = renderToString(
    React.createElement(
      I18nProvider,
      { locale },
      React.createElement(App, { locale, page })
    )
  )
  return html
}

/** 页面元信息（title/description/canonical/hreflang） */
export function pageMeta(locale: string, page: string) {
  return buildPageMeta(locale, page)
}

// ─── 程序化落地页定义 ───────────────────────────────────────────
// 用 slug 元组定义页面集群，自动生成路由 + sitemap + hreflang。
// 这是 zipo.pics 234 页 SEO 落地页的核心机制。

type Slug = string

const SITE = 'https://zipo.pics'

/** 语言代码 → hreflang 标准码 */
const LANG = {
  zh: 'zh-CN',
  'zh-Hant': 'zh-Hant',
  en: 'en',
  tr: 'tr',
  fr: 'fr',
  es: 'es',
  ko: 'ko',
  ja: 'ja',
  fa: 'fa',
}

/** 9 种语言 */
const LOCALES = Object.keys(LANG)

/** 平台预设：kind='developer' 组安全开源；专家预设(kind:'expert')含专有逻辑 */
const PAGES: Record<string, Slug[]> = {
  'compress-image-to': ['20kb', '50kb', '100kb', '200kb', '500kb'],
  'compress-image-for': ['twitter', 'instagram', 'linkedin', 'wordpress', 'web'],
}

/** 生成所有 (locale, page) 目标 */
function generateTargets(): [string, string][] {
  const result: [string, string][] = []
  for (const locale of LOCALES) {
    // 首页
    result.push([locale, 'home'])
    // 每个平台预设 × 每个 slug
    for (const [page, slugs] of Object.entries(PAGES)) {
      for (const slug of slugs) {
        result.push([locale, `${page}/${slug}`])
      }
    }
  }
  return result
}

/** 所有可预渲染的 (locale, page) 组合（须在 LOCALES / PAGES 声明之后初始化） */
export const targets = generateTargets()

/** 构建页面元信息 */
function buildPageMeta(locale: string, page: string) {
  const langCode = LANG[locale] || locale
  const isHome = page === 'home'

  const canonical = isHome ? `${SITE}/${locale}/` : `${SITE}/${locale}/${page}/`
  const title = pageTitle(locale, page)
  const description = pageDescription(locale, page)

  // hreflang: 同一页面的 9 种语言版本互相引用
  const hreflang = LOCALES.map((l) => ({
    href: isHome ? `${SITE}/${l}/` : `${SITE}/${l}/${page}/`,
    hreflang: LANG[l],
  }))

  return {
    locale,
    langCode,
    canonical,
    title,
    description,
    hreflang,
    xDefault: `${SITE}/en/`,
  }
}

/** 生成页面标题 */
function pageTitle(locale: string, page: string): string {
  const t: Record<string, Record<string, string>> = {
    zh: {
      home: '在线图片压缩工具 - 免费无损压缩',
      'compress-image-to/20kb': '压缩图片到 20KB - 在线工具',
      'compress-image-to/50kb': '压缩图片到 50KB - 在线工具',
      'compress-image-for/twitter': '为 Twitter 压缩图片 - 在线工具',
      'compress-image-for/instagram': '为 Instagram 压缩图片 - 在线工具',
      'compress-image-for/web': '为网页压缩图片 - 在线工具',
    },
    en: {
      home: 'Free Image Compressor — Compress Images in Browser',
      'compress-image-to/20kb': 'Compress Image to 20KB — Free Online Tool',
      'compress-image-to/50kb': 'Compress Image to 50KB — Free Online Tool',
      'compress-image-for/twitter': 'Compress Image for Twitter — Free Tool',
      'compress-image-for/instagram': 'Compress Image for Instagram — Free Tool',
      'compress-image-for/web': 'Compress Image for Web — Free Online Tool',
    },
    // 其他语言略——开源示例用 en/zh 演示，生产项目 9 语言全部填充
  }
  const tl = t[locale] || t.en
  return tl[page] || tl.home
}

/** 生成页面描述 */
function pageDescription(locale: string, page: string): string {
  return `${pageTitle(locale, page)} — 100% 浏览器端处理，图片不上传服务器，隐私安全。支持 PNG/JPG/WebP/AVIF 格式。`
}

export { SITE, LOCALES, LANG, PAGES }
