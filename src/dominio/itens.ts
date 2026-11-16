import { ErroNaoEncontrado, ErroValidacao } from './erros'
import { formatarReais } from './formatacao'
import type { ResumoItens } from './listas'
import { Mensagens } from './mensagens'

export const DESCRICAO_ITEM_MAXIMO = 80
export const QUANTIDADE_MINIMA = 1
export const QUANTIDADE_MAXIMA = 999
// R$ 99.999,99
export const VALOR_MAXIMO_CENTAVOS = 9_999_999
export const UNIDADE_PADRAO = Mensagens.itens.unidade

export type Item = {
  id: number
  idLista: number
  descricao: string
  unidade: string
  quantidade: number
  valorUnitarioCentavos: number
  concluido: boolean
}

// O que o usuário informa ao criar ou editar um item.
export type DadosItem = {
  descricao: string
  quantidade: number
  valorUnitarioCentavos: number
}

// Devolve os dados com a descrição sem os espaços das pontas ou recusa com ErroValidacao.
export function validarItem(dados: DadosItem): DadosItem {
  const descricao = dados.descricao.trim()
  if (descricao === '') throw new ErroValidacao(Mensagens.itens.descricaoObrigatoria)
  if (descricao.length > DESCRICAO_ITEM_MAXIMO) throw new ErroValidacao(Mensagens.itens.descricaoMuitoGrande)
  if (
    !Number.isInteger(dados.quantidade) ||
    dados.quantidade < QUANTIDADE_MINIMA ||
    dados.quantidade > QUANTIDADE_MAXIMA
  ) {
    throw new ErroValidacao(Mensagens.itens.quantidadeInvalida)
  }
  // Centavos inteiros: um valor com mais de duas casas decimais chega aqui com fração.
  if (
    !Number.isInteger(dados.valorUnitarioCentavos) ||
    dados.valorUnitarioCentavos < 0 ||
    dados.valorUnitarioCentavos > VALOR_MAXIMO_CENTAVOS
  ) {
    throw new ErroValidacao(Mensagens.itens.valorInvalido)
  }
  return { descricao, quantidade: dados.quantidade, valorUnitarioCentavos: dados.valorUnitarioCentavos }
}

export function subtotalCentavos(item: Pick<Item, 'quantidade' | 'valorUnitarioCentavos'>): number {
  return item.quantidade * item.valorUnitarioCentavos
}

// Pendentes primeiro e concluídos no fim; em cada grupo, a ordem de inclusão (id).
export function compararItens(a: Item, b: Item): number {
  if (a.concluido !== b.concluido) return a.concluido ? 1 : -1
  return a.id - b.id
}

export function ordenarItens(itens: readonly Item[]): Item[] {
  return [...itens].sort(compararItens)
}

// "3 UN × R$ 2,00"
export function textoDetalheItem(item: Pick<Item, 'quantidade' | 'unidade' | 'valorUnitarioCentavos'>): string {
  return Mensagens.itens.detalhe(item.quantidade, item.unidade, formatarReais(item.valorUnitarioCentavos))
}

// "4 de 6 itens concluídos · previsto R$ 51,40"
export function textoResumoRodape(totais: ResumoItens): string {
  return Mensagens.detalhe.resumo(
    totais.quantidadeConcluidos,
    totais.quantidadeItens,
    formatarReais(totais.totalPrevistoCentavos),
  )
}

// Fração da barra de progresso, de 0 a 1.
export function progressoConcluido(totais: ResumoItens): number {
  return totais.quantidadeItens === 0 ? 0 : totais.quantidadeConcluidos / totais.quantidadeItens
}

export function erroItemNaoEncontrado(): ErroNaoEncontrado {
  return new ErroNaoEncontrado(Mensagens.itens.naoEncontrado, 'item')
}

// Máscara do campo de valor (padrão de app bancário): os dígitos digitados são os centavos.
// "075" → 75 centavos. Dígitos além do limite de R$ 99.999,99 são recusados (devolve null).
export function centavosDoTextoDigitado(texto: string): number | null {
  const digitos = texto.replace(/\D/g, '').replace(/^0+/, '')
  if (digitos === '') return 0
  const centavos = Number(digitos)
  return centavos > VALOR_MAXIMO_CENTAVOS ? null : centavos
}
