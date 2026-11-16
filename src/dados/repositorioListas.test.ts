import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroArmazenamento, ErroNaoEncontrado, ErroValidacao } from '../dominio/erros'
import { criarBancoDeTeste, inserirItens } from '../testes/bancoDeTeste'
import type { BancoFeira } from './banco'
import type { RepositorioListas } from './repositorioListas'

let banco: BancoFeira
let repositorio: RepositorioListas

beforeEach(() => {
  const criado = criarBancoDeTeste()
  banco = criado.banco
  repositorio = criado.repositorios.listas
})

afterEach(async () => {
  vi.restoreAllMocks()
  await banco.delete()
})

describe('criar lista', () => {
  it('grava com a data atual e sem itens', async () => {
    const agora = new Date('2026-10-30T12:34:56.789Z')
    const id = await repositorio.inserir('Feira do sábado', agora)
    const [lista] = await repositorio.listar()
    expect(lista).toMatchObject({
      id,
      nome: 'Feira do sábado',
      dataCriacao: '2026-10-30T12:34:56.789Z',
      quantidadeItens: 0,
    })
  })

  it('descarta os espaços das pontas', async () => {
    await repositorio.inserir('  Churrasco  ')
    const [lista] = await repositorio.listar()
    expect(lista.nome).toBe('Churrasco')
  })

  it('nome inválido não grava nada', async () => {
    await expect(repositorio.inserir('   ')).rejects.toThrow(new ErroValidacao('Informe o nome da lista.'))
    await expect(repositorio.inserir('x'.repeat(61))).rejects.toBeInstanceOf(ErroValidacao)
    expect(await banco.listas.count()).toBe(0)
  })

  it('permite nomes repetidos', async () => {
    const a = await repositorio.inserir('Feira 30/10')
    const b = await repositorio.inserir('Feira 30/10')
    expect(a).not.toBe(b)
    expect((await repositorio.listar()).map((l) => l.nome)).toEqual(['Feira 30/10', 'Feira 30/10'])
  })

  it('falha do banco ao gravar vira ErroArmazenamento e nada é criado', async () => {
    vi.spyOn(banco.listas, 'add').mockRejectedValue(new Error('database is locked'))
    const erro = await repositorio.inserir('Feira').catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('salvar')
    vi.restoreAllMocks()
    expect(await banco.listas.count()).toBe(0)
  })
})

describe('renomear lista', () => {
  it('troca só o nome e mantém data e itens', async () => {
    const id = await repositorio.inserir('Feira 30/10', new Date('2026-10-30T10:00:00.000Z'))
    await inserirItens(banco, id, [
      { quantidade: 1, valorUnitarioCentavos: 100, concluido: false },
      { quantidade: 1, valorUnitarioCentavos: 100, concluido: false },
      { quantidade: 1, valorUnitarioCentavos: 100, concluido: true },
    ])
    await repositorio.renomear(id, 'Feira do sábado')
    const [lista] = await repositorio.listar()
    expect(lista).toMatchObject({
      nome: 'Feira do sábado',
      dataCriacao: '2026-10-30T10:00:00.000Z',
      quantidadeItens: 3,
    })
  })

  it('nome inválido mantém o nome antigo', async () => {
    const id = await repositorio.inserir('Feira 30/10')
    await expect(repositorio.renomear(id, '   ')).rejects.toThrow('Informe o nome da lista.')
    expect((await banco.listas.get(id))?.nome).toBe('Feira 30/10')
  })

  it('lista que não existe mais → ErroNaoEncontrado', async () => {
    const id = await repositorio.inserir('Feira')
    await repositorio.excluir(id)
    await expect(repositorio.renomear(id, 'Outra')).rejects.toThrow(
      new ErroNaoEncontrado('Esta lista não existe mais. Atualizamos a tela para você.'),
    )
    expect(await banco.listas.count()).toBe(0)
  })
})

describe('excluir lista', () => {
  it('apaga a lista e os 7 itens dela, sem tocar nas outras', async () => {
    const churrasco = await repositorio.inserir('Churrasco domingo')
    const outra = await repositorio.inserir('Outra')
    await inserirItens(banco, churrasco, Array(7).fill({ quantidade: 1, valorUnitarioCentavos: 100, concluido: false }))
    await inserirItens(banco, outra, [{ quantidade: 1, valorUnitarioCentavos: 100, concluido: false }])

    await repositorio.excluir(churrasco)

    expect(await banco.listas.get(churrasco)).toBeUndefined()
    expect(await banco.itens.where('idLista').equals(churrasco).count()).toBe(0)
    expect(await banco.itens.where('idLista').equals(outra).count()).toBe(1)
  })

  it('apaga lista sem itens', async () => {
    const id = await repositorio.inserir('Vazia')
    await repositorio.excluir(id)
    expect(await banco.listas.count()).toBe(0)
  })

  it('lista que não existe mais → ErroNaoEncontrado', async () => {
    await expect(repositorio.excluir(999)).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })

  it('falha no meio da exclusão não apaga nada', async () => {
    const id = await repositorio.inserir('Churrasco domingo')
    await inserirItens(banco, id, Array(7).fill({ quantidade: 1, valorUnitarioCentavos: 100, concluido: false }))
    // Os itens já foram apagados dentro da transação quando a lista falha.
    vi.spyOn(banco.listas, 'delete').mockRejectedValue(new Error('disk I/O error'))

    const erro = await repositorio.excluir(id).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('excluir')

    vi.restoreAllMocks()
    expect(await banco.listas.get(id)).toBeDefined()
    expect(await banco.itens.where('idLista').equals(id).count()).toBe(7)
  })
})

describe('listar', () => {
  it('nenhuma lista volta vazio, sem erro', async () => {
    expect(await repositorio.listar()).toEqual([])
  })

  it('ordena por data desc e, na mesma data, por id desc', async () => {
    const a = await repositorio.inserir('14/10', new Date('2026-10-14T12:00:00.000Z'))
    const b = await repositorio.inserir('30/10', new Date('2026-10-30T12:00:00.000Z'))
    const c = await repositorio.inserir('28/10', new Date('2026-10-28T12:00:00.000Z'))
    const d = await repositorio.inserir('30/10 de novo', new Date('2026-10-30T12:00:00.000Z'))
    expect((await repositorio.listar()).map((l) => l.id)).toEqual([d, b, c, a])
  })

  it('traz quantidades e totais em centavos', async () => {
    const id = await repositorio.inserir('Feira do sábado')
    await inserirItens(banco, id, [
      { quantidade: 2, valorUnitarioCentavos: 850, concluido: true },
      { quantidade: 1, valorUnitarioCentavos: 1200, concluido: true },
      { quantidade: 3, valorUnitarioCentavos: 180, concluido: true },
      { quantidade: 1, valorUnitarioCentavos: 300, concluido: true },
      { quantidade: 2, valorUnitarioCentavos: 500, concluido: false },
      { quantidade: 1, valorUnitarioCentavos: 400, concluido: false },
    ])
    const vazia = await repositorio.inserir('Vazia')
    const semPreco = await repositorio.inserir('Sem preço')
    await inserirItens(banco, semPreco, [{ quantidade: 1, valorUnitarioCentavos: 0, concluido: true }])

    const porId = new Map((await repositorio.listar()).map((l) => [l.id, l]))
    expect(porId.get(id)).toMatchObject({
      quantidadeItens: 6,
      quantidadeConcluidos: 4,
      totalConcluidoCentavos: 3740,
      totalPrevistoCentavos: 5140,
    })
    expect(porId.get(vazia)).toMatchObject({
      quantidadeItens: 0,
      quantidadeConcluidos: 0,
      totalConcluidoCentavos: 0,
      totalPrevistoCentavos: 0,
    })
    expect(porId.get(semPreco)).toMatchObject({
      quantidadeItens: 1,
      quantidadeConcluidos: 1,
      totalConcluidoCentavos: 0,
    })
  })

  it('falha do banco ao ler vira ErroArmazenamento', async () => {
    vi.spyOn(banco.listas, 'toArray').mockRejectedValue(new Error('database disk image is malformed'))
    const erro = await repositorio.listar().catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('listar')
  })
})
