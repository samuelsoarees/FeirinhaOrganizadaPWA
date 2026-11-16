import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const corFundo = '#181F3D'

// Versão do app no formato AA.M.n (ano, mês, incremental), lida do "version" do package.json.
function versaoDoApp(): string {
  const pacote = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }
  return pacote.version
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  define: {
    __VERSAO_APP__: JSON.stringify(versaoDoApp()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // Os ícones já entram no precache pelo globPatterns.
      includeManifestIcons: false,
      manifest: {
        id: './',
        name: 'Feira Organizada',
        short_name: 'Feira',
        description: 'Listas de feira com o total da compra.',
        lang: 'pt-BR',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        theme_color: corFundo,
        background_color: corFundo,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,txt}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/setup.ts'],
    alias: {
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./src/testes/pwaRegisterFalso.ts', import.meta.url),
      ),
    },
  },
})
