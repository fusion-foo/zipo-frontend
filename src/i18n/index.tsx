import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

// ─── i18n 系统 ───────────────────────────────────────────────
// 自研轻量 i18n，基于 useSyncExternalStore + localStorage。
// 支持 9 种语言、RTL（fa）、fallback 到 en。
// 顶层键须同步全部语言文件，否则 TypeScript 编译失败。

export type Locale = 'zh' | 'zh-Hant' | 'en' | 'tr' | 'fr' | 'es' | 'ko' | 'ja' | 'fa'

export const LOCALES: Locale[] = ['zh', 'zh-Hant', 'en', 'tr', 'fr', 'es', 'ko', 'ja', 'fa']

// 语言映射
export const LANG_LABEL: Record<Locale, string> = {
  zh: '中文',
  'zh-Hant': '繁體中文',
  en: 'English',
  tr: 'Türkçe',
  fr: 'Français',
  es: 'Español',
  ko: '한국어',
  ja: '日本語',
  fa: 'فارسی',
}

// 翻译内容（简化示例，生产项目每个语言一套完整翻译）
const STRINGS: Record<Locale, Record<string, string>> = {
  zh: {
    'home.title': '在线图片压缩工具',
    'home.subtitle': '100% 浏览器端处理，图片不上传服务器',
    'home.cta': '开始压缩',
    'home.features.title': '为什么选择我们',
    'home.features.privacy': '隐私安全',
    'home.features.privacy.desc': '图片在浏览器端处理，不上传服务器',
    'home.features.formats': '全格式支持',
    'home.features.formats.desc': 'PNG、JPG、WebP、AVIF 均可压缩',
    'home.features.speed': '极速压缩',
    'home.features.speed.desc': '基于 WebAssembly 的高效压缩引擎',
  },
  'zh-Hant': {
    'home.title': '線上圖片壓縮工具',
    'home.subtitle': '100% 瀏覽器端處理，圖片不上傳伺服器',
    'home.cta': '開始壓縮',
    'home.features.title': '為什麼選擇我們',
    'home.features.privacy': '隱私安全',
    'home.features.privacy.desc': '圖片在瀏覽器端處理，不上傳伺服器',
    'home.features.formats': '全格式支援',
    'home.features.formats.desc': 'PNG、JPG、WebP、AVIF 均可壓縮',
    'home.features.speed': '極速壓縮',
    'home.features.speed.desc': '基於 WebAssembly 的高效壓縮引擎',
  },
  en: {
    'home.title': 'Free Image Compressor',
    'home.subtitle': '100% browser-side processing — images never leave your device',
    'home.cta': 'Start Compressing',
    'home.features.title': 'Why Us',
    'home.features.privacy': 'Privacy First',
    'home.features.privacy.desc': 'Images processed in browser, never uploaded',
    'home.features.formats': 'All Formats',
    'home.features.formats.desc': 'PNG, JPG, WebP, AVIF — all supported',
    'home.features.speed': 'Blazing Fast',
    'home.features.speed.desc': 'Powered by WebAssembly compression engine',
  },
  tr: {
    'home.title': 'Ücretsiz Görüntü Sıkıştırıcı',
    'home.subtitle': '100% tarayıcı işlemleri — resimler cihazınızdan çıkmaz',
    'home.cta': 'Sıkıştırmaya Başla',
    'home.features.title': 'Neden Biz',
    'home.features.privacy': 'Gizlilik Önceliklidir',
    'home.features.privacy.desc': 'Resimler tarayıcıda işlenir, sürüklenmez',
    'home.features.formats': 'Tüm Formatlar',
    'home.features.formats.desc': 'PNG, JPG, WebP, AVIF — hepsi desteklenir',
    'home.features.speed': 'Aşırı Hızlı',
    'home.features.speed.desc': 'WebAssembly sıkıştırma motoru',
  },
  fr: {
    'home.title': 'Compresseur d\'Image Gratuit',
    'home.subtitle': '100% traitement côté navigateur — les images ne quittent jamais votre appareil',
    'home.cta': 'Commencer la Compression',
    'home.features.title': 'Pourquoi Nous',
    'home.features.privacy': 'Confidentialité D\'abord',
    'home.features.privacy.desc': 'Images traitées dans le navigateur, jamais téléchargées',
    'home.features.formats': 'Tous Formats',
    'home.features.formats.desc': 'PNG, JPG, WebP, AVIF — tous supportés',
    'home.features.speed': 'Ultra Rapide',
    'home.features.speed.desc': 'Moteur de compression WebAssembly',
  },
  es: {
    'home.title': 'Compresor de Imágenes Gratis',
    'home.subtitle': '100% procesamiento en navegador — las imágenes nunca salen de tu dispositivo',
    'home.cta': 'Empezar a Comprimir',
    'home.features.title': 'Por Qué Nosotros',
    'home.features.privacy': 'Privacidad Primero',
    'home.features.privacy.desc': 'Imágenes procesadas en navegador, nunca subidas',
    'home.features.formats': 'Todos los Formatos',
    'home.features.formats.desc': 'PNG, JPG, WebP, AVIF — todos soportados',
    'home.features.speed': 'Extremadamente Rápido',
    'home.features.speed.desc': 'Motor de compresión WebAssembly',
  },
  ko: {
    'home.title': '무료 이미지 압축기',
    'home.subtitle': '100% 브라우저 처리 — 이미지는 기기를 떠나지 않습니다',
    'home.cta': '압축 시작',
    'home.features.title': '우리를 선택하는 이유',
    'home.features.privacy': '프라이버시 우선',
    'home.features.privacy.desc': '이미지는 브라우저에서 처리되며 업로드되지 않습니다',
    'home.features.formats': '모든 형식',
    'home.features.formats.desc': 'PNG, JPG, WebP, AVIF — 모두 지원',
    'home.features.speed': '초고속',
    'home.features.speed.desc': 'WebAssembly 압축 엔진',
  },
  ja: {
    'home.title': '無料画像圧縮ツール',
    'home.subtitle': '100% ブラウザ内処理 — 画像はデバイスから外に出ません',
    'home.cta': '圧縮を始める',
    'home.features.title': '選ばれる理由',
    'home.features.privacy': 'プライバシー優先',
    'home.features.privacy.desc': '画像はブラウザで処理され、アップロードされません',
    'home.features.formats': '全フォーマット対応',
    'home.features.formats.desc': 'PNG、JPG、WebP、AVIF — すべて対応',
    'home.features.speed': '超高速',
    'home.features.speed.desc': 'WebAssembly 圧縮エンジン',
  },
  fa: {
    'home.title': 'کامپریسر رایگان تصویر',
    'home.subtitle': '۱۰۰٪ پردازش در مرورگر — تصاویر هرگز دستگاه شما را ترک نمی‌کنند',
    'home.cta': 'شروع فشرده‌سازی',
    'home.features.title': 'چرا ما',
    'home.features.privacy': 'خصوصیت اولویت دارد',
    'home.features.privacy.desc': 'تصاویر در مرورگر پردازش می‌شوند، بارگذاری نمی‌شوند',
    'home.features.formats': 'همه فرمت‌ها',
    'home.features.formats.desc': 'PNG، JPG، WebP، AVIF — همه پشتیبانی می‌شوند',
    'home.features.speed': 'بسیار سریع',
    'home.features.speed.desc': 'موتور فشرده‌سازی WebAssembly',
  },
}

// 外部存储：localStorage 持久化语言选择
const listeners = new Set<() => void>()
let currentLocale: Locale = 'en'

function notify() {
  listeners.forEach((l) => l())
}

function getLocaleSnapshot(): Locale {
  return currentLocale
}

function getLocaleServerSnapshot(): Locale {
  return 'en'
}

// ─── I18nProvider ─────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({ locale: 'en', t: (k) => k })

export function I18nProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  currentLocale = locale

  // 同步 <html lang> / <html dir>
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr'
  }, [locale])

  const t = (key: string): string => {
    const dict = STRINGS[currentLocale] || STRINGS.en
    return dict[key] || STRINGS.en[key] || key
  }

  return React.createElement(I18nContext.Provider, { value: { locale, t } }, children)
}

export function useI18n() {
  return useContext(I18nContext)
}

// 导出供外部使用
export function setLocale(locale: Locale) {
  currentLocale = locale
  localStorage.setItem('zipo_locale', locale)
  notify()
}

export { getLocaleSnapshot, getLocaleServerSnapshot }
