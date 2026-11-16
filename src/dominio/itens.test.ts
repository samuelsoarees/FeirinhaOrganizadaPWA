import { describe, expect, it } from 'vitest'
import { ErroNaoEncontrado, ErroValidacao } from './erros'
import {
  centavosDoTextoDigitado,
  erroItemNaoEncontrado,
  ordenarItens,
  progressoConcluido,
  subtotalCentavos,
  textoDetalheItem,
  textoResumoRodape,
  validarItem,
  type DadosItem,
  type Item,
} from './itens'
import { resumirItens } from './listas'
import { Mensagens } from './mensagens'

const valido: DadosItem = { descricao: 'Banana prata', quantidade: 5, valorUnitarioCentavos: 75 }

function item(id: number, descricao: string, concluido: boolean, quantidade = 1, valorUnitarioCentavos = 100): Item {
  return { id, idLista: 1, descricao, unidade: 'UN', quantidade, valorUnitarioCentavos, concluido }
}

describe('validar item', () => {
  it('dados válidos passam com a descrição sem os espaços das pontas', () => {
    expect(validarItem(valido)).toEqual(valido)
    expect(validarItem({ ...valido, descricao: '  Tomate  ' }).descricao).toBe('Tomate')
  })

  it('descrição vazia', () => {
    expect(() => validarItem({ ...valido, descricao: '   ' })).toThrow(
      new ErroValidacao('Informe a descrição do item.'),
    )
  })

  it('descrição com 81 caracteres é recusada e com 80 passa completa', () => {
    expect(() => validarItem({ ...valido, descricao: 'x'.repeat(81) })).toThrow(
      new ErroValidacao('A descrição do item pode ter no máximo 80 caracteres.'),
    )
    expect(validarItem({ ...valido, descricao: 'x'.repeat(80) }).descricao).toHaveLength(80)
  })

  it.each([0, 1.5, 1000, -1, Number.NaN])('quantidade %s é recusada', (quantidade) => {
    expect(() => validarItem({ ...valido, quantidade })).toThrow(
      new ErroValidacao('A quantidade deve ser um número inteiro de 1 a 999.'),
    )
  })

  it.each([1, 999])('quantidade %i passa', (quantidade) => {
    expect(validarItem({ ...valido, quantidade }).quantidade).toBe(quantidade)
  })

  it.each([
    ['negativo', -100],
    ['acima de R$ 99.999,99', 10_000_000],
    ['com mais de duas casas decimais', 75.5],
  ])('valor %s é recusado', (_, valorUnitarioCentavos) => {
    expect(() => validarItem({ ...valido, valorUnitarioCentavos })).toThrow(
      new ErroValidacao('O valor unitário deve ficar entre R$ 0,00 e R$ 99.999,99.'),
    )
  })

  it.each([0, 9_999_999])('valor %i centavos passa', (valorUnitarioCentavos) => {
    expect(validarItem({ ...valido, valorUnitarioCentavos }).valorUnitarioCentavos).toBe(valorUnitarioCentavos)
  })
})

describe('ordenar itens', () => {
  it('pendentes antes dos concluídos, cada grupo na ordem de inclusão', () => {
    const itens = [item(1, 'Tomate', true), item(2, 'Abacaxi', false), item(3, 'Alface', true)]
    expect(ordenarItens(itens).map((i) => i.descricao)).toEqual(['Abacaxi', 'Tomate', 'Alface'])
  })

  it('desmarcar volta à posição de inclusão', () => {
    const marcado = [item(1, 'Abacaxi', true), item(2, 'Pimentão', false), item(3, 'Tomate', false)]
    expect(ordenarItens(marcado).map((i) => i.descricao)).toEqual(['Pimentão', 'Tomate', 'Abacaxi'])
    const desmarcado = marcado.map((i) => ({ ...i, concluido: false }))
    expect(ordenarItens(desmarcado).map((i) => i.descricao)).toEqual(['Abacaxi', 'Pimentão', 'Tomate'])
  })

  it('não altera a lista recebida', () => {
    const itens = [item(2, 'B', false), item(1, 'A', false)]
    ordenarItens(itens)
    expect(itens.map((i) => i.id)).toEqual([2, 1])
  })
})

describe('subtotal e totais', () => {
  it('subtotal de 12 UN × R$ 1,10 é R$ 13,20', () => {
    expect(subtotalCentavos({ quantidade: 12, valorUnitarioCentavos: 110 })).toBe(1320)
  })

  it('4 concluídos somando R$ 37,40 e 2 pendentes somando R$ 14,00', () => {
    const totais = resumirItens([
      item(1, 'Tomate', true, 6, 120),
      item(2, 'Alface americana', true, 2, 350),
      item(3, 'Ovos caipira', true, 12, 110),
      item(4, 'Manga palmer', true, 4, 250),
      item(5, 'Abacaxi pérola', false, 1, 800),
      item(6, 'Pimentão', false, 3, 200),
    ])
    expect(totais.totalConcluidoCentavos).toBe(3740)
    expect(totais.totalPrevistoCentavos).toBe(5140)
  })

  it('três concluídos de R$ 0,10 somam exatamente R$ 0,30', () => {
    const totais = resumirItens([item(1, 'a', true, 1, 10), item(2, 'b', true, 1, 10), item(3, 'c', true, 1, 10)])
    expect(totais.totalConcluidoCentavos).toBe(30)
  })

  it('progresso é concluídos sobre o total de itens', () => {
    expect(progressoConcluido(resumirItens([]))).toBe(0)
    expect(progressoConcluido(resumirItens([item(1, 'a', true), item(2, 'b', false)]))).toBe(0.5)
  })
})

describe('textos', () => {
  it('linha do item: "qtd UN × R$ unitário"', () => {
    expect(textoDetalheItem({ quantidade: 3, unidade: 'UN', valorUnitarioCentavos: 200 })).toBe('3 UN × R$ 2,00')
  })

  it('rodapé com 6 itens, 4 concluídos', () => {
    expect(
      textoResumoRodape({
        quantidadeItens: 6,
        quantidadeConcluidos: 4,
        totalConcluidoCentavos: 3740,
        totalPrevistoCentavos: 5140,
      }),
    ).toBe('4 de 6 itens concluídos · previsto R$ 51,40')
  })

  it('rodapé com um item', () => {
    expect(
      textoResumoRodape({
        quantidadeItens: 1,
        quantidadeConcluidos: 0,
        totalConcluidoCentavos: 0,
        totalPrevistoCentavos: 375,
      }),
    ).toBe('0 de 1 item concluído · previsto R$ 3,75')
  })

  it('rodapé sem itens', () => {
    expect(textoResumoRodape(resumirItens([]))).toBe('nenhum item · previsto R$ 0,00')
  })

  it('rótulo dos concluídos e confirmação de exclusão', () => {
    expect(Mensagens.detalhe.concluidos(4)).toBe('Concluídos (4)')
    expect(Mensagens.itens.excluirTitulo).toBe('Excluir item?')
    expect(Mensagens.itens.excluirMensagem('Pimentão')).toBe('“Pimentão” será excluído. Essa ação não pode ser desfeita.')
  })

  it('item que não existe mais', () => {
    const erro = erroItemNaoEncontrado()
    expect(erro).toBeInstanceOf(ErroNaoEncontrado)
    expect(erro.alvo).toBe('item')
    expect(erro.message).toBe('Este item não existe mais. Atualizamos a tela para você.')
  })
})

describe('máscara do valor', () => {
  it.each([
    ['', 0],
    ['0', 0],
    ['075', 75],
    ['0,75', 75],
    ['0,750', 750],
    ['1.234,56', 123456],
    ['99.999,99', 9_999_999],
  ])('"%s" → %i centavos', (texto, centavos) => {
    expect(centavosDoTextoDigitado(texto)).toBe(centavos)
  })

  it('recusa dígitos além de R$ 99.999,99', () => {
    expect(centavosDoTextoDigitado('99.999,990')).toBeNull()
  })
})
