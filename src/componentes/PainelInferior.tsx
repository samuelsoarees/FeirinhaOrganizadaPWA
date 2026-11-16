import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useCamada } from '../navegacao/camadas'
import './PainelInferior.css'

type Props = {
  aberto: boolean
  titulo: string
  // Chamado pelo voltar do Android. Tocar fora do painel não fecha.
  aoVoltar: () => void
  children: ReactNode
}

type AreaVisivel = { teclado: number; altura: number | null }

// Parte da tela coberta pelo teclado virtual, pelo visualViewport. No iPhone o teclado não
// encolhe a página: sem isso, o painel preso ao fundo ficaria atrás do teclado.
function useAreaVisivel(ativo: boolean): AreaVisivel {
  const [area, setArea] = useState<AreaVisivel>({ teclado: 0, altura: null })

  useEffect(() => {
    const viewport = window.visualViewport
    if (!ativo || !viewport) return
    const atualizar = () => {
      const teclado = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
      setArea({ teclado, altura: Math.round(viewport.height) })
    }
    atualizar()
    viewport.addEventListener('resize', atualizar)
    viewport.addEventListener('scroll', atualizar)
    return () => {
      viewport.removeEventListener('resize', atualizar)
      viewport.removeEventListener('scroll', atualizar)
    }
  }, [ativo])

  return area
}

// Painel que sobe da parte de baixo da tela (bottom sheet) e acompanha o teclado.
export function PainelInferior({ aberto, titulo, aoVoltar, children }: Props) {
  const idTitulo = useId()
  const { teclado, altura } = useAreaVisivel(aberto)
  useCamada(aberto, aoVoltar)

  if (!aberto) return null

  const estilo = {
    '--teclado': `${teclado}px`,
    ...(altura !== null && { '--altura-visivel': `${altura}px` }),
  } as CSSProperties

  return (
    <>
      <div className="overlay painel-overlay" data-testid="fundo-painel" />
      <div
        className={`painel-inferior${teclado > 0 ? ' painel-inferior--teclado' : ''}`}
        style={estilo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
      >
        <div className="painel-alca" aria-hidden="true" />
        <h2 id={idTitulo} className="painel-titulo">
          {titulo}
        </h2>
        {children}
      </div>
    </>
  )
}
