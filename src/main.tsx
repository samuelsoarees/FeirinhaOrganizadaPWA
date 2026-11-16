import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import './estilo/tokens.css'
import './estilo/base.css'
import { App } from './App'
import { capturarEventosInstalacao } from './pwa/instalacao'

capturarEventosInstalacao()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
