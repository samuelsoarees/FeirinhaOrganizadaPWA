import { useLayoutEffect, useRef, type RefObject } from 'react'

// Tempo do item deslizando para a nova posição ao mudar de grupo.
export const DURACAO_FLIP_MS = 250

function prefereReduzirMovimento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// Quanto a animação em andamento ainda desloca o elemento na vertical. Com dois toques seguidos,
// a nova animação parte de onde o elemento está na tela, sem pular.
function deslocamentoEmAndamento(elemento: HTMLElement): number {
  const animacoes = elemento.getAnimations?.() ?? []
  if (animacoes.length === 0) return 0
  const transform = getComputedStyle(elemento).transform
  const deslocamento = transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m42 : 0
  animacoes.forEach((animacao) => animacao.cancel())
  return deslocamento
}

// Animação FLIP (First, Last, Invert, Play) dos filhos com `data-flip` dentro de `raiz`.
// A cada mudança de `dependencia`, compara o `offsetTop` de cada elemento com o da renderização
// anterior e anima o `transform` da posição antiga até a nova. O `offsetTop` não muda com a rolagem
// nem com o próprio `transform`, então a medida só reflete a troca de lugar na lista.
export function useAnimacaoFlip(raiz: RefObject<HTMLElement | null>, dependencia: unknown) {
  const posicoes = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const anteriores = posicoes.current
    const novas = new Map<string, number>()
    posicoes.current = novas
    const elementos = raiz.current?.querySelectorAll<HTMLElement>('[data-flip]') ?? []
    const animar = !prefereReduzirMovimento()

    elementos.forEach((elemento) => {
      const chave = elemento.dataset.flip ?? ''
      const topo = elemento.offsetTop
      novas.set(chave, topo)
      const anterior = anteriores.get(chave)
      if (!animar || anterior === undefined || typeof elemento.animate !== 'function') return
      const inicio = anterior - topo + deslocamentoEmAndamento(elemento)
      if (Math.abs(inicio) < 1) return
      elemento.animate([{ transform: `translateY(${inicio}px)` }, { transform: 'translateY(0)' }], {
        duration: DURACAO_FLIP_MS,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
      })
    })
  }, [raiz, dependencia])
}
