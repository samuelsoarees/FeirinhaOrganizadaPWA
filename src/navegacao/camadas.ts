import { createContext, useContext, useEffect, useRef } from 'react'
import type { PilhaCamadas } from './PilhaCamadas'

export const ContextoPilhaCamadas = createContext<PilhaCamadas | null>(null)

export function usePilhaCamadas(): PilhaCamadas {
  const pilha = useContext(ContextoPilhaCamadas)
  if (!pilha) throw new Error('usePilhaCamadas precisa do ProvedorCamadas')
  return pilha
}

// Registra a camada na pilha enquanto `aberta` for true. `aoVoltar` é chamado quando o
// voltar do Android fecha esta camada; quem chama deve então passar `aberta` para false.
export function useCamada(aberta: boolean, aoVoltar: () => void): void {
  const pilha = usePilhaCamadas()
  const aoVoltarAtual = useRef(aoVoltar)

  useEffect(() => {
    aoVoltarAtual.current = aoVoltar
  })

  useEffect(() => {
    if (!aberta) return
    const id = pilha.abrir(() => aoVoltarAtual.current())
    return () => pilha.fechar(id)
  }, [aberta, pilha])
}
