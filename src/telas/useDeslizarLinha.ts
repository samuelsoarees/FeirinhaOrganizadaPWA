import { useRef, useState, type MouseEvent as EventoMouse, type PointerEvent as EventoPonteiro } from 'react'

// Largura do botão "Excluir" revelado (docs/mock-telas.html, tela 4).
export const LARGURA_EXCLUIR_PX = 76
// Abaixo disso o dedo ainda é toque; acima, decide entre deslizar (horizontal) e rolar (vertical).
export const TOLERANCIA_DESLIZE_PX = 10

type Inicio = { x: number; y: number; base: number; deslizando: boolean; posicao: number }

type Opcoes = {
  revelada: boolean
  // true revela o "Excluir"; false esconde.
  aoRevelar: (revelada: boolean) => void
  aoTocar: () => void
}

// Deslizar a linha para a esquerda revela o "Excluir"; para a direita, esconde.
// Com o "Excluir" revelado, um toque na linha só esconde o botão.
export function useDeslizarLinha({ revelada, aoRevelar, aoTocar }: Opcoes) {
  const [arraste, setArraste] = useState<number | null>(null)
  const inicio = useRef<Inicio | null>(null)
  const ignorarClique = useRef(false)

  const terminar = (confirmar: boolean) => {
    const atual = inicio.current
    inicio.current = null
    if (!atual?.deslizando) return
    ignorarClique.current = true
    setArraste(null)
    if (confirmar) aoRevelar(atual.posicao < -LARGURA_EXCLUIR_PX / 2)
  }

  const deslocamento = arraste ?? (revelada ? -LARGURA_EXCLUIR_PX : 0)

  return {
    deslocamento,
    arrastando: arraste !== null,
    handlers: {
      onPointerDown: (evento: EventoPonteiro<HTMLElement>) => {
        if (evento.pointerType === 'mouse' && evento.button !== 0) return
        ignorarClique.current = false
        const base = revelada ? -LARGURA_EXCLUIR_PX : 0
        inicio.current = { x: evento.clientX, y: evento.clientY, base, deslizando: false, posicao: base }
      },
      onPointerMove: (evento: EventoPonteiro<HTMLElement>) => {
        const atual = inicio.current
        if (!atual) return
        const dx = evento.clientX - atual.x
        const dy = evento.clientY - atual.y
        if (!atual.deslizando) {
          if (Math.abs(dy) > TOLERANCIA_DESLIZE_PX && Math.abs(dy) >= Math.abs(dx)) {
            // Rolagem vertical: não é deslize nem toque.
            inicio.current = null
            ignorarClique.current = true
            return
          }
          if (Math.abs(dx) <= TOLERANCIA_DESLIZE_PX) return
          atual.deslizando = true
          evento.currentTarget.setPointerCapture?.(evento.pointerId)
        }
        atual.posicao = Math.min(0, Math.max(-LARGURA_EXCLUIR_PX, atual.base + dx))
        setArraste(atual.posicao)
      },
      onPointerUp: () => terminar(true),
      onPointerCancel: () => {
        ignorarClique.current = true
        terminar(false)
      },
      onClick: (evento: EventoMouse<HTMLElement>) => {
        if (ignorarClique.current) {
          ignorarClique.current = false
          evento.preventDefault()
          return
        }
        if (revelada) aoRevelar(false)
        else aoTocar()
      },
    },
  }
}
