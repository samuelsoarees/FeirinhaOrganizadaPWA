import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Dialog, type OpcoesDialog } from './Dialog'
import { ContextoDialog, type MostrarDialog } from './useDialog'

const opcoesVazias: OpcoesDialog = { icone: 'info', titulo: '', mensagem: '' }

// Um dialog por vez, como o TFancyDialog.
export function ProvedorDialog({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const [opcoes, setOpcoes] = useState<OpcoesDialog>(opcoesVazias)
  const resolverAtual = useRef<((confirmado: boolean) => void) | null>(null)

  const mostrar = useCallback<MostrarDialog>((novasOpcoes) => {
    resolverAtual.current?.(false)
    return new Promise<boolean>((resolver) => {
      resolverAtual.current = resolver
      setOpcoes(novasOpcoes)
      setAberto(true)
    })
  }, [])

  const aoFechar = useCallback((confirmado: boolean) => {
    setAberto(false)
    const resolver = resolverAtual.current
    resolverAtual.current = null
    resolver?.(confirmado)
  }, [])

  return (
    <ContextoDialog.Provider value={mostrar}>
      {children}
      <Dialog aberto={aberto} opcoes={opcoes} aoFechar={aoFechar} />
    </ContextoDialog.Provider>
  )
}
