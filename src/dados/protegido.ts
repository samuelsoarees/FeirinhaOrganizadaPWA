import { ErroArmazenamento, ErroNaoEncontrado, ErroValidacao, type OperacaoArmazenamento } from '../dominio/erros'

// Erros de regra passam direto; qualquer outro (Dexie, IndexedDB, disco) vira ErroArmazenamento.
export async function protegido<T>(operacao: OperacaoArmazenamento, acao: () => Promise<T>): Promise<T> {
  try {
    return await acao()
  } catch (erro) {
    if (erro instanceof ErroValidacao || erro instanceof ErroNaoEncontrado) throw erro
    throw new ErroArmazenamento(operacao, erro)
  }
}
