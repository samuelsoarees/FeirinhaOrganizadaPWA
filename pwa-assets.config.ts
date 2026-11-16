import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const fundo = '#181F3D'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: {
      ...minimal2023Preset.transparent,
      padding: 0.08,
      resizeOptions: { background: fundo, fit: 'contain' },
    },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.25,
      resizeOptions: { background: fundo, fit: 'contain' },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.12,
      resizeOptions: { background: fundo, fit: 'contain' },
    },
  },
  images: ['public/barraca.png'],
})
