import React from 'react'
import { useI18n } from './i18n'

interface AppProps {
  locale: string
  page: string
}

/**
 * App — 顶层组件
 *
 * 根据 (locale, page) 渲染对应页面。
 * SSG 预渲染时被 entry-server.tsx 调用，客户端水合后接管。
 */
export default function App({ locale, page }: AppProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 顶部导航 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-brand-600">
            zipo
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/en/" className="hover:text-brand-600">EN</a>
            <a href="/zh/" className="hover:text-brand-600">中文</a>
            <a href="/ja/" className="hover:text-brand-600">日本語</a>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main>{renderPage(locale, page)}</main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            Built with Vite + React + Tailwind CSS.{' '}
            <a href="https://zipo.pics" className="text-brand-500 hover:text-brand-600">
              zipo.pics
            </a>
          </p>
          <p className="text-xs mt-2">
            100% browser-side image compression — privacy by design.
          </p>
        </div>
      </footer>
    </div>
  )
}

function renderPage(locale: string, page: string) {
  switch (page) {
    case 'home':
      return <HomePage />
    default:
      return <LandingPage page={page} />
  }
}

// ─── 首页 ─────────────────────────────────────────────────────
function HomePage() {
  const { t } = useI18n()
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('home.title')}</h1>
        <p className="text-lg text-gray-600 mb-8">{t('home.subtitle')}</p>
        <a
          href="#"
          className="inline-block bg-brand-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-700 transition"
        >
          {t('home.cta')}
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-20">
        <FeatureCard title={t('home.features.privacy')} desc={t('home.features.privacy.desc')} icon="🔒" />
        <FeatureCard title={t('home.features.formats')} desc={t('home.features.formats.desc')} icon="🖼️" />
        <FeatureCard title={t('home.features.speed')} desc={t('home.features.speed.desc')} icon="⚡" />
      </div>
    </div>
  )
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  )
}

// ─── 程序化落地页 ─────────────────────────────────────────────
function LandingPage({ page }: { page: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 capitalize">
          {page.replace(/-/g, ' ')}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          A free online tool by{' '}
          <a href="https://zipo.pics" className="text-brand-600 hover:text-brand-700">
            zipo.pics
          </a>
          — compress images directly in your browser.
        </p>
        <a
          href="https://zipo.pics"
          className="inline-block bg-brand-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-700 transition"
        >
          Try it Free →
        </a>
      </div>
    </div>
  )
}
