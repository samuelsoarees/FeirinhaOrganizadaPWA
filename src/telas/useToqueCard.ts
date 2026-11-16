import { useEffect, useRef, useState, type MouseEvent as EventoMouse, type PointerEvent as EventoPonteiro } from 'react'

export const TEMPO_TOQUE_LONGO_MS = 500
// Movimento maior que isso é rolagem: cancela o toque e o toque longo.
export const TOLERANCIA_MOVIMENTO_PX = 10

type Inicio = { x: number; y: number; rolagem: number }

function rolagemDe(elemento: Element): number {
  return elemento.closest('[data-rolagem]')?.scrollTop ?? 0
}

// Toque simples, toque longo e rolagem sobre o card, com Pointer Events.
export function useToqueCard({ aoTocar, aoTocarLongo }: { aoTocar: () => void; aoTocarLongo: () => void }) {
  const [pressionado, setPressionado] = useState(false)
  const inicio = useRef<Inicio | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ignorarClique = useRef(false)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const cancelar = () => {
    clearTimeout(temporizador.current)
    setPressionado(false)
  }

  return {
    pressionado,
    handlers: {
      onPointerDown: (evento: EventoPonteiro<HTMLElement>) => {
        if (evento.pointerType === 'mouse' && evento.button !== 0) return
        inicio.current = { x: evento.clientX, y: evento.clientY, rolagem: rolagemDe(evento.currentTarget) }
        ignorarClique.current = false
        setPressionado(true)
        clearTimeout(temporizador.current)
        temporizador.current = setTimeout(() => {
          ignorarClique.current = true
          setPressionado(false)
          aoTocarLongo()
        }, TEMPO_TOQUE_LONGO_MS)
      },
      onPointerMove: (evento: EventoPonteiro<HTMLElement>) => {
        if (!inicio.current) return
        const dx = Math.abs(evento.clientX - inicio.current.x)
        const dy = Math.abs(evento.clientY - inicio.current.y)
        if (dx > TOLERANCIA_MOVIMENTO_PX || dy > TOLERANCIA_MOVIMENTO_PX) {
          ignorarClique.current = true
          cancelar()
        }
      },
      onPointerUp: cancelar,
      onPointerLeave: cancelar,
      // O navegador assumiu o gesto (rolagem): não é toque.
      onPointerCancel: () => {
        ignorarClique.current = true
        cancelar()
      },
      onContextMenu: (evento: EventoMouse) => evento.preventDefault(),
      onClick: (evento: EventoMouse<HTMLElement>) => {
        const rolou =
          inicio.current !== null &&
          Math.abs(rolagemDe(evento.currentTarget) - inicio.current.rolagem) > TOLERANCIA_MOVIMENTO_PX
        inicio.current = null
        if (ignorarClique.current || rolou) {
          ignorarClique.current = false
          return
        }
        aoTocar()
      },
    },
  }
}
