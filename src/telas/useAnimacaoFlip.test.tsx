import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DURACAO_FLIP_MS, useAnimacaoFlip } from './useAnimacaoFlip'

const ALTURA_LINHA = 50

// O jsdom não calcula layout: cada <li> fica no offsetTop da sua posição na lista.
function simularLayout() {
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      const irmaos = this.parentElement ? Array.from(this.parentElement.children) : []
      return irmaos.indexOf(this) * ALTURA_LINHA
    },
  })
}

function Lista({ itens }: { itens: string[] }) {
  const raiz = useRef<HTMLUListElement>(null)
  useAnimacaoFlip(raiz, itens)
  return (
    <ul ref={raiz}>
      {itens.map((item) => (
        <li key={item} data-flip={item}>
          {item}
        </li>
      ))}
    </ul>
  )
}

let animate: ReturnType<typeof vi.fn>
let reduzirMovimento = false

beforeEach(() => {
  simularLayout()
  animate = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate })
  reduzirMovimento = false
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (consulta: string) => ({ matches: reduzirMovimento && consulta.includes('reduce'), media: consulta }),
  })
})

afterEach(() => {
  delete (HTMLElement.prototype as { offsetTop?: number }).offsetTop
  delete (HTMLElement.prototype as { animate?: unknown }).animate
  delete (window as { matchMedia?: unknown }).matchMedia
})

function animacoesPorItem(): Record<string, string> {
  const resultado: Record<string, string> = {}
  for (const chamada of animate.mock.contexts.map((contexto, i) => [contexto, animate.mock.calls[i]] as const)) {
    const [elemento, [quadros, opcoes]] = chamada as [HTMLElement, [Keyframe[], KeyframeAnimationOptions]]
    expect(opcoes.duration).toBe(DURACAO_FLIP_MS)
    resultado[elemento.dataset.flip ?? ''] = String(quadros[0].transform)
  }
  return resultado
}

describe('animação FLIP do item mudando de grupo', () => {
  it('na primeira renderização nada anima', () => {
    render(<Lista itens={['Abacaxi', 'Pimentão', 'Tomate']} />)
    expect(animate).not.toHaveBeenCalled()
  })

  it('cada item que mudou de lugar desliza a partir da posição antiga', () => {
    const { rerender } = render(<Lista itens={['Abacaxi', 'Pimentão', 'Tomate']} />)
    // "Abacaxi" marcado: desce para o fim; os outros sobem uma linha.
    rerender(<Lista itens={['Pimentão', 'Tomate', 'Abacaxi']} />)
    expect(animacoesPorItem()).toEqual({
      Abacaxi: 'translateY(-100px)',
      Pimentão: 'translateY(50px)',
      Tomate: 'translateY(50px)',
    })
  })

  it('itens que não mudaram de lugar não animam', () => {
    const { rerender } = render(<Lista itens={['Abacaxi', 'Pimentão', 'Tomate']} />)
    rerender(<Lista itens={['Abacaxi', 'Tomate', 'Pimentão']} />)
    expect(Object.keys(animacoesPorItem()).sort()).toEqual(['Pimentão', 'Tomate'])
  })

  it('com redução de movimento no sistema, troca sem animação', () => {
    reduzirMovimento = true
    const { rerender } = render(<Lista itens={['Abacaxi', 'Pimentão', 'Tomate']} />)
    rerender(<Lista itens={['Pimentão', 'Tomate', 'Abacaxi']} />)
    expect(animate).not.toHaveBeenCalled()
  })
})
