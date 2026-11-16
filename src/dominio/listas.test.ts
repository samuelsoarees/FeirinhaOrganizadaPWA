import { describe, expect, it } from 'vitest'
import { ErroValidacao } from './erros'
import { compararListas, corDoToldo, nomeSugerido, resumirItens, validarNomeLista, type Lista } from './listas'

function erroDe(acao: () => unknown): unknown {
  try {
    acao()
  } catch (erro) {
    return erro
  }
  throw new Error('a ação não falhou')
}

describe('validarNomeLista', () => {
  it('aceita um nome válido', () => {
    expect(validarNomeLista('Feira do sábado')).toBe('Feira do sábado')
  })

  it('descarta os espaços das pontas', () => {
    expect(validarNomeLista('  Churrasco  ')).toBe('Churrasco')
  })

  it.each(['', '    '])('recusa o nome "%s" com "Informe o nome da lista."', (nome) => {
    const erro = erroDe(() => validarNomeLista(nome))
    expect(erro).toBeInstanceOf(ErroValidacao)
    expect((erro as Error).message).toBe('Informe o nome da lista.')
  })

  it('recusa 61 caracteres', () => {
    const erro = erroDe(() => validarNomeLista('a'.repeat(61)))
    expect(erro).toBeInstanceOf(ErroValidacao)
    expect((erro as Error).message).toBe('O nome da lista pode ter no máximo 60 caracteres.')
  })

  it('aceita exatamente 60 caracteres', () => {
    const nome = 'b'.repeat(60)
    expect(validarNomeLista(nome)).toBe(nome)
  })

  it('conta o limite depois de descartar os espaços', () => {
    const nome = 'c'.repeat(60)
    expect(validarNomeLista(`  ${nome}  `)).toBe(nome)
  })
})

describe('resumirItens', () => {
  it('6 itens, 4 concluídos somando R$ 37,40 e 2 pendentes somando R$ 14,00', () => {
    const resumo = resumirItens([
      { quantidade: 2, valorUnitarioCentavos: 850, concluido: true },
      { quantidade: 1, valorUnitarioCentavos: 1200, concluido: true },
      { quantidade: 3, valorUnitarioCentavos: 180, concluido: true },
      { quantidade: 1, valorUnitarioCentavos: 300, concluido: true },
      { quantidade: 2, valorUnitarioCentavos: 500, concluido: false },
      { quantidade: 1, valorUnitarioCentavos: 400, concluido: false },
    ])
    expect(resumo).toEqual({
      quantidadeItens: 6,
      quantidadeConcluidos: 4,
      totalConcluidoCentavos: 3740,
      totalPrevistoCentavos: 5140,
    })
  })

  it('lista sem itens', () => {
    expect(resumirItens([])).toEqual({
      quantidadeItens: 0,
      quantidadeConcluidos: 0,
      totalConcluidoCentavos: 0,
      totalPrevistoCentavos: 0,
    })
  })

  it('item concluído sem preço', () => {
    expect(resumirItens([{ quantidade: 3, valorUnitarioCentavos: 0, concluido: true }])).toEqual({
      quantidadeItens: 1,
      quantidadeConcluidos: 1,
      totalConcluidoCentavos: 0,
      totalPrevistoCentavos: 0,
    })
  })
})

describe('compararListas', () => {
  const lista = (id: number, dataCriacao: string): Lista => ({ id, nome: `L${id}`, dataCriacao })

  it('ordena da data mais recente para a mais antiga', () => {
    const listas = [
      lista(1, '2026-10-14T12:00:00.000Z'),
      lista(2, '2026-10-30T12:00:00.000Z'),
      lista(3, '2026-10-28T12:00:00.000Z'),
    ]
    expect(listas.sort(compararListas).map((l) => l.id)).toEqual([2, 3, 1])
  })

  it('na mesma data e hora, a criada por último vem primeiro', () => {
    const mesmaData = '2026-10-30T12:00:00.000Z'
    expect([lista(5, mesmaData), lista(9, mesmaData)].sort(compararListas).map((l) => l.id)).toEqual([9, 5])
  })
})

describe('nomeSugerido', () => {
  it('usa "Feira dd/mm" com a data do dia', () => {
    expect(nomeSugerido(new Date(2026, 9, 31))).toBe('Feira 31/10')
    expect(nomeSugerido(new Date(2026, 0, 5))).toBe('Feira 05/01')
  })
})

describe('corDoToldo', () => {
  it('escolhe a cor pelo id mod 4', () => {
    expect([4, 5, 6, 7].map(corDoToldo)).toEqual(['#4BBBBD', '#FDCB6E', '#C2BE55', '#E9775F'])
  })

  it('a cor de uma lista não depende das outras', () => {
    expect(corDoToldo(12)).toBe(corDoToldo(12 + 4 * 10))
  })
})
