import { useEffect, useState, type ReactNode } from 'react'
import { ContextoPilhaCamadas } from './camadas'
import { PilhaCamadas } from './PilhaCamadas'

export function ProvedorCamadas({ children, pilha }: { children: ReactNode; pilha?: PilhaCamadas }) {
  const [instancia] = useState(() => pilha ?? new PilhaCamadas())
  useEffect(() => instancia.instalar(), [instancia])
  return <ContextoPilhaCamadas.Provider value={instancia}>{children}</ContextoPilhaCamadas.Provider>
}
