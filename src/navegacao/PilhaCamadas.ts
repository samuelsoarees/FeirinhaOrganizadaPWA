// Pilha das camadas abertas (dialog, modal, menu, painel) ligada ao history do navegador.
// Cada camada aberta empilha uma entrada no history; o voltar do Android (popstate) fecha só a do topo.
// Fechar pela própria camada volta o history, e o popstate resultante é ignorado.
//
// O history.back() é assíncrono. Se uma camada fecha e outra abre no mesmo toque (menu → modal,
// menu → dialog), um back seguido de pushState disputaria a mesma entrada. Por isso o back fica
// para o fim da tarefa atual (microtask), e uma camada aberta antes disso reaproveita a entrada
// com replaceState.

type Camada = { id: number; aoVoltar: () => void }

export class PilhaCamadas {
  private camadas: Camada[] = []
  private proximoId = 1
  private popstatesIgnorados = 0
  private backsPendentes = 0
  private backAgendado = false
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
    if (this.backsPendentes > 0) {
      this.backsPendentes--
      this.janela.history.replaceState({ camada: id }, '')
    } else {
      this.janela.history.pushState({ camada: id }, '')
    }
    return id
  }

  // Fecha uma camada por ação da própria tela (botão, toque fora, desmontagem).
  // Se ela já saiu da pilha pelo voltar, não faz nada.
  fechar(id: number): void {
    const indice = this.camadas.findIndex((c) => c.id === id)
    if (indice < 0) return
    this.camadas.splice(indice, 1)
    this.backsPendentes++
    this.agendarBack()
  }

  // Enquanto bloqueada (operação em andamento), o voltar é desfeito.
  definirBloqueio(bloqueada: boolean): void {
    this.bloqueada = bloqueada
  }

  private agendarBack(): void {
    if (this.backAgendado) return
    this.backAgendado = true
    queueMicrotask(() => {
      this.backAgendado = false
      const quantas = this.backsPendentes
      this.backsPendentes = 0
      if (quantas === 0) return
      // history.go(-n) gera um popstate só.
      this.popstatesIgnorados++
      if (quantas === 1) this.janela.history.back()
      else this.janela.history.go(-quantas)
    })
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
