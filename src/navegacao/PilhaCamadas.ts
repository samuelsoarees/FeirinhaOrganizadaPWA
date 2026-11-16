// Pilha das camadas abertas (dialog, modal, menu, painel) ligada ao history do navegador.
// Cada camada aberta empilha uma entrada no history; o voltar do Android (popstate) fecha só a do topo.
// Fechar pela própria camada chama history.back(), e o popstate resultante é ignorado.

type Camada = { id: number; aoVoltar: () => void }

export class PilhaCamadas {
  private camadas: Camada[] = []
  private proximoId = 1
  private popstatesIgnorados = 0
  private bloqueada = false
  private readonly janela: Window

  constructor(janela: Window = window) {
    this.janela = janela
  }

  instalar(): () => void {
    this.janela.addEventListener('popstate', this.aoPopstate)
    return () => this.janela.removeEventListener('popstate', this.aoPopstate)
  }

  get quantidade(): number {
    return this.camadas.length
  }

  abrir(aoVoltar: () => void): number {
    const id = this.proximoId++
    this.camadas.push({ id, aoVoltar })
    this.janela.history.pushState({ camada: id }, '')
    return id
  }

  // Fecha uma camada por ação da própria tela (botão, toque fora, desmontagem).
  // Se ela já saiu da pilha pelo voltar, não faz nada.
  fechar(id: number): void {
    const indice = this.camadas.findIndex((c) => c.id === id)
    if (indice < 0) return
    this.camadas.splice(indice, 1)
    this.popstatesIgnorados++
    this.janela.history.back()
  }

  // Enquanto bloqueada (operação em andamento), o voltar é desfeito.
  definirBloqueio(bloqueada: boolean): void {
    this.bloqueada = bloqueada
  }

  private aoPopstate = (): void => {
    if (this.popstatesIgnorados > 0) {
      this.popstatesIgnorados--
      return
    }
    if (this.bloqueada && this.camadas.length > 0) {
      this.janela.history.pushState({ camada: this.camadas[this.camadas.length - 1].id }, '')
      return
    }
    const topo = this.camadas.pop()
    topo?.aoVoltar()
  }
}
