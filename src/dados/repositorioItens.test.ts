import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroArmazenamento, ErroNaoEncontrado, ErroValidacao } from '../dominio/erros'
import { criarBancoDeTeste } from '../testes/bancoDeTeste'
import type { BancoFeira } from './banco'
import type { Repositorios } from './repositorios'

let banco: BancoFeira
let repositorios: Repositorios
let idLista: number

beforeEach(async () => {
  const criado = criarBancoDeTeste()
  banco = criado.banco
  repositorios = criado.repositorios
  idLista = await repositorios.listas.inserir('Feira do sábado')
})

afterEach(async () => {
  vi.restoreAllMocks()
  await banco.delete()
})

const banana = { descricao: 'Banana prata', quantidade: 5, valorUnitarioCentavos: 75 }

describe('criar item', () => {
  it('grava com a unidade UN, não concluído e ligado à lista', async () => {
    const id = await repositorios.itens.inserir(idLista, banana)
    expect(await banco.itens.get(id)).toEqual({
      id,
      idLista,
      descricao: 'Banana prata',
      unidade: 'UN',
      quantidade: 5,
      valorUnitarioCentavos: 75,
      concluido: 0,
    })
  })

  it('descarta os espaços das pontas', async () => {
    const id = await repositorios.itens.inserir(idLista, { ...banana, descricao: '  Tomate  ' })
    expect((await banco.itens.get(id))?.descricao).toBe('Tomate')
  })

  it('dados inválidos não gravam nada', async () => {
    await expect(repositorios.itens.inserir(idLista, { ...banana, descricao: '   ' })).rejects.toBeInstanceOf(ErroValidacao)
    await expect(repositorios.itens.inserir(idLista, { ...banana, quantidade: 0 })).rejects.toBeInstanceOf(ErroValidacao)
    expect(await banco.itens.count()).toBe(0)
  })

  it('lista que não existe mais → ErroNaoEncontrado de lista e nada é gravado', async () => {
    await repositorios.listas.excluir(idLista)
    const erro = await repositorios.itens.inserir(idLista, banana).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroNaoEncontrado)
    expect((erro as ErroNaoEncontrado).alvo).toBe('lista')
    expect((erro as Error).message).toBe('Esta lista não existe mais. Atualizamos a tela para você.')
    expect(await banco.itens.count()).toBe(0)
  })

  it('falha do banco ao gravar vira ErroArmazenamento e nada é criado', async () => {
    vi.spyOn(banco.itens, 'add').mockRejectedValue(new Error('QuotaExceededError'))
    const erro = await repositorios.itens.inserir(idLista, banana).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('salvar')
    vi.restoreAllMocks()
    expect(await banco.itens.count()).toBe(0)
  })
})

describe('listar itens', () => {
  it('só os da lista, pendentes antes dos concluídos e cada grupo na ordem de inclusão', async () => {
    const outra = await repositorios.listas.inserir('Outra')
    const tomate = await repositorios.itens.inserir(idLista, { ...banana, descricao: 'Tomate' })
    await repositorios.itens.inserir(idLista, { ...banana, descricao: 'Abacaxi' })
    const alface = await repositorios.itens.inserir(idLista, { ...banana, descricao: 'Alface' })
    await repositorios.itens.inserir(outra, { ...banana, descricao: 'De outra lista' })
    await banco.itens.bulkUpdate([
      { key: tomate, changes: { concluido: 1 } },
      { key: alface, changes: { concluido: 1 } },
    ])

    const itens = await repositorios.itens.listar(idLista)
    expect(itens.map((i) => [i.descricao, i.concluido])).toEqual([
      ['Abacaxi', false],
      ['Tomate', true],
      ['Alface', true],
    ])
  })

  it('lista sem itens volta vazio', async () => {
    expect(await repositorios.itens.listar(idLista)).toEqual([])
  })

  it('falha do banco ao ler vira ErroArmazenamento', async () => {
    vi.spyOn(banco.itens, 'where').mockImplementation(() => {
      throw new Error('database disk image is malformed')
    })
    const erro = await repositorios.itens.listar(idLista).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('listar')
  })
})

describe('editar item', () => {
  it('troca os dados e mantém lista, id e concluído', async () => {
    const id = await repositorios.itens.inserir(idLista, { descricao: 'Tomate', quantidade: 6, valorUnitarioCentavos: 120 })
    await banco.itens.update(id, { concluido: 1 })

    await repositorios.itens.editar(id, { descricao: ' Tomate italiano ', quantidade: 8, valorUnitarioCentavos: 110 })

    expect(await banco.itens.get(id)).toMatchObject({
      id,
      idLista,
      descricao: 'Tomate italiano',
      quantidade: 8,
      valorUnitarioCentavos: 110,
      concluido: 1,
    })
  })

  it('dados inválidos mantêm o item como estava', async () => {
    const id = await repositorios.itens.inserir(idLista, banana)
    await expect(repositorios.itens.editar(id, { ...banana, quantidade: 1000 })).rejects.toBeInstanceOf(ErroValidacao)
    expect((await banco.itens.get(id))?.quantidade).toBe(5)
  })

  it('item que não existe mais → ErroNaoEncontrado de item', async () => {
    const erro = await repositorios.itens.editar(999, banana).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroNaoEncontrado)
    expect((erro as ErroNaoEncontrado).alvo).toBe('item')
    expect((erro as Error).message).toBe('Este item não existe mais. Atualizamos a tela para você.')
    expect(await banco.itens.count()).toBe(0)
  })
})

describe('excluir item', () => {
  it('tira só o item, sem alterar os demais', async () => {
    const ids = []
    for (const descricao of ['Tomate', 'Alface', 'Ovos', 'Manga', 'Abacaxi', 'Pimentão']) {
      ids.push(await repositorios.itens.inserir(idLista, { ...banana, descricao }))
    }
    await repositorios.itens.excluir(ids[5])
    const restantes = await repositorios.itens.listar(idLista)
    expect(restantes).toHaveLength(5)
    expect(restantes.map((i) => i.descricao)).not.toContain('Pimentão')
  })

  it('item que não existe mais → ErroNaoEncontrado de item', async () => {
    const erro = await repositorios.itens.excluir(999).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroNaoEncontrado)
    expect((erro as ErroNaoEncontrado).alvo).toBe('item')
  })

  it('falha do banco vira ErroArmazenamento e o item continua', async () => {
    const id = await repositorios.itens.inserir(idLista, banana)
    vi.spyOn(banco.itens, 'delete').mockRejectedValue(new Error('disk I/O error'))
    const erro = await repositorios.itens.excluir(id).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('excluir')
    vi.restoreAllMocks()
    expect(await banco.itens.get(id)).toBeDefined()
  })
})

describe('marcar e desmarcar item', () => {
  it('marcar grava só o concluído, com os mesmos dados de antes', async () => {
    const id = await repositorios.itens.inserir(idLista, { descricao: 'Pimentão', quantidade: 3, valorUnitarioCentavos: 200 })
    const antes = await banco.itens.get(id)

    await repositorios.itens.marcar(id, true)

    expect(await banco.itens.get(id)).toEqual({ ...antes, concluido: 1 })
  })

  it('desmarcar grava não concluído', async () => {
    const id = await repositorios.itens.inserir(idLista, { descricao: 'Tomate', quantidade: 6, valorUnitarioCentavos: 120 })
    await repositorios.itens.marcar(id, true)
    await repositorios.itens.marcar(id, false)
    expect((await banco.itens.get(id))?.concluido).toBe(0)
  })

  it('marcar duas vezes o mesmo valor não é erro', async () => {
    const id = await repositorios.itens.inserir(idLista, banana)
    await repositorios.itens.marcar(id, true)
    await expect(repositorios.itens.marcar(id, true)).resolves.toBeUndefined()
  })

  it('desmarcar volta o item à posição de inclusão entre os pendentes', async () => {
    const abacaxi = await repositorios.itens.inserir(idLista, { ...banana, descricao: 'Abacaxi' })
    await repositorios.itens.inserir(idLista, { ...banana, descricao: 'Pimentão' })
    await repositorios.itens.inserir(idLista, { ...banana, descricao: 'Tomate' })

    await repositorios.itens.marcar(abacaxi, true)
    expect((await repositorios.itens.listar(idLista)).map((i) => i.descricao)).toEqual(['Pimentão', 'Tomate', 'Abacaxi'])

    await repositorios.itens.marcar(abacaxi, false)
    expect((await repositorios.itens.listar(idLista)).map((i) => i.descricao)).toEqual(['Abacaxi', 'Pimentão', 'Tomate'])
  })

  it('item com R$ 0,00 fica concluído e o total concluído da lista não muda', async () => {
    const tomate = await repositorios.itens.inserir(idLista, { descricao: 'Tomate', quantidade: 2, valorUnitarioCentavos: 150 })
    const brinde = await repositorios.itens.inserir(idLista, { descricao: 'Cheiro-verde', quantidade: 1, valorUnitarioCentavos: 0 })
    await repositorios.itens.marcar(tomate, true)
    const antes = (await repositorios.listas.listar())[0]

    await repositorios.itens.marcar(brinde, true)

    expect((await banco.itens.get(brinde))?.concluido).toBe(1)
    const depois = (await repositorios.listas.listar())[0]
    expect(depois.totalConcluidoCentavos).toBe(antes.totalConcluidoCentavos)
    expect(depois.totalConcluidoCentavos).toBe(300)
  })

  it('item que não existe mais → ErroNaoEncontrado de item', async () => {
    const erro = await repositorios.itens.marcar(999, true).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroNaoEncontrado)
    expect((erro as ErroNaoEncontrado).alvo).toBe('item')
    expect((erro as Error).message).toBe('Este item não existe mais. Atualizamos a tela para você.')
    expect(await banco.itens.count()).toBe(0)
  })

  it('falha do banco vira ErroArmazenamento de marcar e o item continua como estava', async () => {
    const id = await repositorios.itens.inserir(idLista, banana)
    vi.spyOn(banco.itens, 'update').mockRejectedValue(new Error('disk I/O error'))
    const erro = await repositorios.itens.marcar(id, true).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('marcar')
    vi.restoreAllMocks()
    expect((await banco.itens.get(id))?.concluido).toBe(0)
  })
})

describe('obter lista', () => {
  it('devolve a lista ou ErroNaoEncontrado', async () => {
    expect((await repositorios.listas.obter(idLista)).nome).toBe('Feira do sábado')
    await expect(repositorios.listas.obter(999)).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })
})

// "Abacaxi" e "Pimentão" pendentes; "Tomate" e "Alface" concluídos, na ordem de inclusão.
async function criarFeiraMista(lista = idLista): Promise<number[]> {
  const ids = []
  for (const [descricao, concluido] of [
    ['Abacaxi', false],
    ['Tomate', true],
    ['Pimentão', false],
    ['Alface', true],
  ] as const) {
    const id = await repositorios.itens.inserir(lista, { ...banana, descricao })
    if (concluido) await repositorios.itens.marcar(id, true)
    ids.push(id)
  }
  return ids
}

describe('desmarcar todos os itens da lista', () => {
  it('desmarca os concluídos, mantém os dados e informa quantos foram desmarcados', async () => {
    await criarFeiraMista()
    const antes = await banco.itens.where('idLista').equals(idLista).sortBy('id')
    expect(await repositorios.itens.desmarcarTodos(idLista)).toBe(2)
    const depois = await banco.itens.where('idLista').equals(idLista).sortBy('id')
    expect(depois).toEqual(antes.map((registro) => ({ ...registro, concluido: 0 })))
  })

  it('os itens voltam à ordem de inclusão', async () => {
    await criarFeiraMista()
    await repositorios.itens.desmarcarTodos(idLista)
    expect((await repositorios.itens.listar(idLista)).map((item) => item.descricao)).toEqual([
      'Abacaxi',
      'Tomate',
      'Pimentão',
      'Alface',
    ])
  })

  it('sem concluídos não muda nada e informa 0', async () => {
    await repositorios.itens.inserir(idLista, banana)
    const antes = await banco.itens.toArray()
    expect(await repositorios.itens.desmarcarTodos(idLista)).toBe(0)
    expect(await banco.itens.toArray()).toEqual(antes)
  })

  it('os itens de outras listas não mudam', async () => {
    const outra = await repositorios.listas.inserir('Feira do mês')
    await criarFeiraMista()
    await criarFeiraMista(outra)
    await repositorios.itens.desmarcarTodos(idLista)
    expect(await banco.itens.where('idLista').equals(outra).filter((r) => r.concluido === 1).count()).toBe(2)
  })

  it('lista que não existe mais → ErroNaoEncontrado de lista', async () => {
    await repositorios.listas.excluir(idLista)
    const erro = await repositorios.itens.desmarcarTodos(idLista).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroNaoEncontrado)
    expect((erro as ErroNaoEncontrado).alvo).toBe('lista')
    expect((erro as Error).message).toBe('Esta lista não existe mais. Atualizamos a tela para você.')
  })

  it('falha no meio da gravação vira ErroArmazenamento de desmarcar e nenhum item muda', async () => {
    for (const descricao of ['Tomate', 'Alface', 'Ovos', 'Manga']) {
      await repositorios.itens.marcar(await repositorios.itens.inserir(idLista, { ...banana, descricao }), true)
    }
    const gravar = banco.itens.bulkUpdate.bind(banco.itens)
    vi.spyOn(banco.itens, 'bulkUpdate').mockImplementation(async (mudancas) => {
      await gravar(mudancas.slice(0, 2))
      throw new Error('disk I/O error')
    })
    const erro = await repositorios.itens.desmarcarTodos(idLista).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('desmarcar')
    vi.restoreAllMocks()
    expect(await banco.itens.filter((r) => r.concluido === 1).count()).toBe(4)
  })
})
