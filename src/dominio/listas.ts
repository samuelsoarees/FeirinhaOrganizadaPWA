import { ErroValidacao } from './erros'
import { formatarDiaMes } from './formatacao'
import { Mensagens } from './mensagens'

export const NOME_LISTA_MAXIMO = 60

export const CORES_TOLDO = ['#4BBBBD', '#FDCB6E', '#C2BE55', '#E9775F'] as const

export type Lista = {
  id: number
  nome: string
  // ISO 8601 (UTC), ordena como texto.
  dataCriacao: string
}

// Lista com o resumo dos itens, como a tela de Listas mostra.
export type ResumoLista = Lista & {
  quantidadeItens: number
  quantidadeConcluidos: number
  totalConcluidoCentavos: number
  totalPrevistoCentavos: number
}

export type ItemParaResumo = {
  quantidade: number
  valorUnitarioCentavos: number
  concluido: boolean
}

export type ResumoItens = Pick<
  ResumoLista,
  'quantidadeItens' | 'quantidadeConcluidos' | 'totalConcluidoCentavos' | 'totalPrevistoCentavos'
>

// Total concluído soma só os concluídos; o previsto soma todos. Tudo em centavos inteiros.
export function resumirItens(itens: readonly ItemParaResumo[]): ResumoItens {
  const resumo: ResumoItens = {
    quantidadeItens: 0,
    quantidadeConcluidos: 0,
    totalConcluidoCentavos: 0,
    totalPrevistoCentavos: 0,
  }
  for (const item of itens) {
    const subtotal = item.quantidade * item.valorUnitarioCentavos
    resumo.quantidadeItens++
    resumo.totalPrevistoCentavos += subtotal
    if (item.concluido) {
      resumo.quantidadeConcluidos++
      resumo.totalConcluidoCentavos += subtotal
    }
  }
  return resumo
}

// Devolve o nome sem os espaços das pontas ou recusa com ErroValidacao.
export function validarNomeLista(nome: string): string {
  const limpo = nome.trim()
  if (limpo === '') throw new ErroValidacao(Mensagens.listas.nomeObrigatorio)
  if (limpo.length > NOME_LISTA_MAXIMO) throw new ErroValidacao(Mensagens.listas.nomeMuitoGrande)
  return limpo
}

// Mais recente primeiro; na mesma data, a criada por último (maior id) primeiro.
export function compararListas(a: Lista, b: Lista): number {
  if (a.dataCriacao !== b.dataCriacao) return a.dataCriacao < b.dataCriacao ? 1 : -1
  return b.id - a.id
}

export function nomeSugerido(hoje: Date): string {
  return Mensagens.listas.nomeSugerido(formatarDiaMes(hoje))
}

// A cor depende só do id, então não muda quando outras listas são criadas ou excluídas.
export function corDoToldo(id: number): string {
  return CORES_TOLDO[((id % 4) + 4) % 4]
}
