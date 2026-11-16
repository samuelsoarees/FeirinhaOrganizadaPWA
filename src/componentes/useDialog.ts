import { createContext, useContext } from 'react'
import type { OpcoesDialog } from './Dialog'

export type MostrarDialog = (opcoes: OpcoesDialog) => Promise<boolean>

export const ContextoDialog = createContext<MostrarDialog | null>(null)

// Mostra o dialog e resolve true quando o usuário confirma.
export function useDialog(): MostrarDialog {
  const mostrar = useContext(ContextoDialog)
  if (!mostrar) throw new Error('useDialog precisa do ProvedorDialog')
  return mostrar
}
