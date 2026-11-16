import { useEffect, useRef, useState } from 'react'

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

type EstadoComOrigem = { veioDeListas?: boolean } | null

// Abre o detalhe a partir de Listas. A marca no history.state diz que a entrada anterior é
// Listas: voltar do detalhe é então um history.back(), sem empilhar outra entrada de Listas
// (senão o voltar do Android em Listas reabriria o detalhe em vez de sair do app).
export function abrirDetalhe(idLista: number): void {
  navegar({ tela: 'detalhe', idLista: String(idLista) })
  const estado = (window.history.state ?? {}) as Record<string, unknown>
  window.history.replaceState({ ...estado, veioDeListas: true }, '')
}

// Volta para Listas. Quem abriu o detalhe pelo endereço (link, recarga sem Listas antes) não
// tem Listas atrás no history: troca a entrada atual por Listas.
export function voltarParaListas(): void {
  if ((window.history.state as EstadoComOrigem)?.veioDeListas) window.history.back()
  else window.location.replace(hashDaRota({ tela: 'listas' }))
}

// `segurar`: enquanto devolver true (operação em andamento), uma troca de hash vinda do voltar
// é desfeita e a tela continua onde estava.
export function useRota(segurar?: () => boolean): Rota {
  const [rota, setRota] = useState<Rota>(() => interpretarHash(window.location.hash))
  const segurarAtual = useRef(segurar)
  const aceita = useRef({ hash: window.location.hash, estado: window.history.state as unknown })

  useEffect(() => {
    segurarAtual.current = segurar
  })

  useEffect(() => {
    const aoMudarHash = () => {
      if (segurarAtual.current?.()) {
        window.history.pushState(aceita.current.estado, '', aceita.current.hash || '#/')
        return
      }
      aceita.current = { hash: window.location.hash, estado: window.history.state }
      setRota(interpretarHash(window.location.hash))
    }
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [])

  return rota
}
