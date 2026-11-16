import { useEffect, useState } from 'react'

export type Rota = { tela: 'listas' } | { tela: 'detalhe'; idLista: string }

const padraoDetalhe = /^#\/lista\/(\d+)\/?$/

export function interpretarHash(hash: string): Rota {
  const detalhe = padraoDetalhe.exec(hash)
  if (detalhe) return { tela: 'detalhe', idLista: detalhe[1] }
  return { tela: 'listas' }
}

export function hashDaRota(rota: Rota): string {
  return rota.tela === 'detalhe' ? `#/lista/${rota.idLista}` : '#/'
}

export function navegar(rota: Rota): void {
  window.location.hash = hashDaRota(rota)
}

export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(() => interpretarHash(window.location.hash))

  useEffect(() => {
    const aoMudarHash = () => setRota(interpretarHash(window.location.hash))
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [])

  return rota
}
