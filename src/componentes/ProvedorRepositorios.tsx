import type { ReactNode } from 'react'
import type { Repositorios } from '../dados/repositorios'
import { ContextoRepositorios } from './useRepositorios'

// Os testes passam repositórios sobre um banco próprio; o app usa o banco padrão.
export function ProvedorRepositorios({ repositorios, children }: { repositorios: Repositorios; children: ReactNode }) {
  return <ContextoRepositorios.Provider value={repositorios}>{children}</ContextoRepositorios.Provider>
}
