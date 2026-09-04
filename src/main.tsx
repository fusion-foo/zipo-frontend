import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nProvider } from './i18n'
import App from './App'

// 客户端入口
const rootEl = document.getElementById('app')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <I18nProvider locale={detectLocale()}>
      <App locale={detectLocale()} page="home" />
    </I18nProvider>
  )
}

function detectLocale(): string {
  const url = new URL(window.location.href)
  const path = url.pathname.split('/').filter(Boolean)[0]
  // SSR 注入的全局变量优先
  if (typeof __ZIPO_LOCALE__ !== 'undefined') return __ZIPO_LOCALE__
  return path || 'en'
}

declare global {
  var __ZIPO_LOCALE__: string
}
