// Erros que as telas sabem tratar. Qualquer outro erro vira "Ops!" com a mensagem genérica da operação.

// Regra de negócio recusou o dado. A tela mostra "Atenção" com a mensagem.
export class ErroValidacao extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ErroValidacao'
  }
}

export type AlvoNaoEncontrado = 'lista' | 'item'

// A lista ou o item deixou de existir. A tela mostra "Atenção" e recarrega.
// `alvo` diz o que sumiu: no detalhe, lista inexistente volta para Listas e item inexistente só recarrega.
export class ErroNaoEncontrado extends Error {
  readonly alvo: AlvoNaoEncontrado

  constructor(mensagem: string, alvo: AlvoNaoEncontrado = 'lista') {
    super(mensagem)
    this.name = 'ErroNaoEncontrado'
    this.alvo = alvo
  }
}

export type OperacaoArmazenamento = 'listar' | 'salvar' | 'excluir'

// Falha técnica do banco. A tela nunca mostra o texto técnico, só a mensagem genérica da operação.
export class ErroArmazenamento extends Error {
  readonly operacao: OperacaoArmazenamento

  constructor(operacao: OperacaoArmazenamento, causa?: unknown) {
    super(`Falha de armazenamento ao ${operacao}`, { cause: causa })
    this.name = 'ErroArmazenamento'
    this.operacao = operacao
  }
}
