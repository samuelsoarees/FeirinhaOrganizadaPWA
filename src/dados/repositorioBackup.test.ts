import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { backupParaTexto, lerBackup } from '../dominio/backup'
import { ErroArmazenamento } from '../dominio/erros'
import { criarBancoDeTeste } from '../testes/bancoDeTeste'
import type { BancoFeira } from './banco'
import type { Repositorios } from './repositorios'

let banco: BancoFeira
let repositorios: Repositorios
const outrosBancos: BancoFeira[] = []

beforeEach(() => {
  const criado = criarBancoDeTeste()
  banco = criado.banco
  repositorios = criado.repositorios
})

afterEach(async () => {
  vi.restoreAllMocks()
  await banco.delete()
  for (const outro of outrosBancos.splice(0)) await outro.delete()
})

// 3 listas e 12 itens, com marcações, item de R$ 0,00 e uma lista vazia.
async function popular(r: Repositorios) {
  const sabado = await r.listas.inserir('Feira do sábado', new Date('2026-10-30T12:00:00.000Z'))
  const churrasco = await r.listas.inserir('Churrasco', new Date('2026-10-28T12:00:00.000Z'))
  await r.listas.inserir('Vazia', new Date('2026-10-30T12:00:00.000Z'))
  for (let i = 1; i <= 8; i++) {
    const id = await r.itens.inserir(sabado, { descricao: `Item ${i}`, quantidade: i, valorUnitarioCentavos: i * 125 })
    if (i % 3 === 0) await r.itens.marcar(id, true)
  }
  for (let i = 1; i <= 4; i++) {
    const id = await r.itens.inserir(churrasco, { descricao: `Carne ${i}`, quantidade: 1, valorUnitarioCentavos: i === 4 ? 0 : 3990 })
    if (i >= 3) await r.itens.marcar(id, true)
  }
}

async function retrato(r: Repositorios) {
  const listas = await r.listas.listar()
  return Promise.all(listas.map(async (lista) => ({ ...lista, itens: await r.itens.listar(lista.id) })))
}

describe('exportar', () => {
  it('traz todas as listas e todos os itens com todos os dados', async () => {
    await popular(repositorios)
    const backup = await repositorios.backup.exportar(new Date('2026-11-16T13:00:00.000Z'))
    expect(backup).toMatchObject({ app: 'feira-organizada', versao: 1, exportadoEm: '2026-11-16T13:00:00.000Z' })
    expect(backup.listas.map((l) => l.nome)).toEqual(['Feira do sábado', 'Churrasco', 'Vazia'])
    expect(backup.listas.flatMap((l) => l.itens)).toHaveLength(12)
    expect(backup.listas[1].itens[3]).toEqual({
      id: 12,
      descricao: 'Carne 4',
      unidade: 'UN',
      quantidade: 1,
      valorUnitarioCentavos: 0,
      concluido: true,
    })
  })

  it('sem listas devolve um backup sem listas', async () => {
    expect((await repositorios.backup.exportar()).listas).toEqual([])
  })

  it('falha do banco vira ErroArmazenamento de exportar', async () => {
    vi.spyOn(banco.itens, 'toArray').mockRejectedValue(new Error('disk I/O error'))
    const erro = await repositorios.backup.exportar().catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('exportar')
  })
})

describe('importar', () => {
  it('exportar → importar em outro aparelho dá o mesmo resultado', async () => {
    await popular(repositorios)
    const texto = backupParaTexto(await repositorios.backup.exportar())

    const outro = criarBancoDeTeste()
    outrosBancos.push(outro.banco)
    await outro.repositorios.listas.inserir('Lista antiga do outro aparelho')
    await outro.repositorios.backup.importar(lerBackup(texto))

    expect(await retrato(outro.repositorios)).toEqual(await retrato(repositorios))
    expect(await outro.repositorios.backup.contarListas()).toBe(3)
  })

  it('substitui os dados atuais e o app continua criando listas e itens depois', async () => {
    await popular(repositorios)
    const backup = await repositorios.backup.exportar()
    await repositorios.listas.inserir('Será substituída')

    await repositorios.backup.importar(backup)
    // Mesma data: a de maior id (Vazia) vem antes, como antes de exportar.
    expect((await repositorios.listas.listar()).map((l) => l.nome)).toEqual(['Vazia', 'Feira do sábado', 'Churrasco'])

    const nova = await repositorios.listas.inserir('Nova')
    const item = await repositorios.itens.inserir(nova, { descricao: 'Pão', quantidade: 1, valorUnitarioCentavos: 100 })
    expect(nova).toBeGreaterThan(3)
    expect(item).toBeGreaterThan(12)
  })

  it('falha no meio da importação mantém os dados anteriores', async () => {
    await popular(repositorios)
    const antes = await retrato(repositorios)
    const backup = await repositorios.backup.exportar()
    backup.listas = [{ id: 50, nome: 'Do backup', dataCriacao: '2026-11-01T12:00:00.000Z', itens: [] }]
    // As listas e os itens já foram apagados dentro da transação quando a gravação falha.
    vi.spyOn(banco.listas, 'bulkAdd').mockRejectedValue(new Error('QuotaExceededError'))

    const erro = await repositorios.backup.importar(backup).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroArmazenamento)
    expect((erro as ErroArmazenamento).operacao).toBe('importar')

    vi.restoreAllMocks()
    expect(await retrato(repositorios)).toEqual(antes)
  })

  it('falha ao gravar os itens também desfaz as listas gravadas', async () => {
    await popular(repositorios)
    const antes = await retrato(repositorios)
    const backup = await repositorios.backup.exportar()
    vi.spyOn(banco.itens, 'bulkAdd').mockRejectedValue(new Error('disk I/O error'))

    await expect(repositorios.backup.importar(backup)).rejects.toBeInstanceOf(ErroArmazenamento)

    vi.restoreAllMocks()
    expect(await retrato(repositorios)).toEqual(antes)
  })
})
