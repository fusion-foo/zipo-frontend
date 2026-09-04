import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
