import { describe, expect, it } from 'vitest'
import { backupParaTexto, lerBackup, montarBackup, nomeArquivoBackup, type Backup } from './backup'
import { ErroBackupInvalido } from './erros'
import type { Item } from './itens'
import type { Lista } from './listas'

const MENSAGEM_INVALIDO = 'Este arquivo não é um backup válido do Feira Organizada.'

function backupValido(): Backup {
  return {
    app: 'feira-organizada',
    versao: 1,
    exportadoEm: '2026-11-16T13:00:00.000Z',
    listas: [
      {
        id: 1,
        nome: 'Feira do sábado',
        dataCriacao: '2026-10-30T12:00:00.000Z',
        itens: [
          { id: 1, descricao: 'Tomate', unidade: 'UN', quantidade: 2, valorUnitarioCentavos: 850, concluido: true },
          { id: 3, descricao: 'Alface', unidade: 'UN', quantidade: 1, valorUnitarioCentavos: 0, concluido: false },
        ],
      },
      { id: 2, nome: 'Churrasco', dataCriacao: '2026-10-28T12:00:00.000Z', itens: [] },
    ],
  }
}

function comoTexto(dados: unknown): string {
  return JSON.stringify(dados)
}

function esperarInvalido(texto: string) {
  let erro: unknown
  try {
    lerBackup(texto)
  } catch (e) {
    erro = e
  }
  expect(erro).toBeInstanceOf(ErroBackupInvalido)
  expect((erro as Error).message).toBe(MENSAGEM_INVALIDO)
}

describe('montar o backup', () => {
  it('junta cada lista com os seus itens, com todos os dados', () => {
    const listas: Lista[] = [
      { id: 2, nome: 'Churrasco', dataCriacao: '2026-10-28T12:00:00.000Z' },
      { id: 1, nome: 'Feira do sábado', dataCriacao: '2026-10-30T12:00:00.000Z' },
    ]
    const itens: Item[] = [
      { id: 3, idLista: 1, descricao: 'Alface', unidade: 'UN', quantidade: 1, valorUnitarioCentavos: 0, concluido: false },
      { id: 1, idLista: 1, descricao: 'Tomate', unidade: 'UN', quantidade: 2, valorUnitarioCentavos: 850, concluido: true },
    ]
    expect(montarBackup(listas, itens, new Date('2026-11-16T13:00:00.000Z'))).toEqual(backupValido())
  })

  it('o texto gerado é lido de volta igual', () => {
    expect(lerBackup(backupParaTexto(backupValido()))).toEqual(backupValido())
  })

  it('o nome do arquivo leva a data do dia', () => {
    expect(nomeArquivoBackup(new Date(2026, 10, 16, 23, 59))).toBe('feira-organizada-backup-2026-11-16.json')
    expect(nomeArquivoBackup(new Date(2027, 0, 5, 0, 1))).toBe('feira-organizada-backup-2027-01-05.json')
  })
})

describe('ler o backup', () => {
  it('aceita um backup válido', () => {
    expect(lerBackup(comoTexto(backupValido()))).toEqual(backupValido())
  })

  it('descarta os espaços das pontas do nome e da descrição, como ao criar', () => {
    const dados = backupValido()
    dados.listas[0].nome = '  Feira do sábado  '
    dados.listas[0].itens[0].descricao = ' Tomate '
    const lido = lerBackup(comoTexto(dados))
    expect(lido.listas[0].nome).toBe('Feira do sábado')
    expect(lido.listas[0].itens[0].descricao).toBe('Tomate')
  })

  it('recusa JSON inválido', () => {
    esperarInvalido('{ "app": "feira-organizada", ')
    esperarInvalido('')
  })

  it('recusa arquivo que não é texto, como uma foto', () => {
    esperarInvalido('ÿØÿà\u0000\u0010JFIF')
  })

  it('recusa backup de outro app', () => {
    esperarInvalido(comoTexto({ ...backupValido(), app: 'outro-app' }))
    esperarInvalido(comoTexto({ ...backupValido(), app: undefined }))
  })

  it('recusa versão desconhecida do formato', () => {
    esperarInvalido(comoTexto({ ...backupValido(), versao: 2 }))
  })

  it('recusa JSON que não é objeto', () => {
    esperarInvalido('[]')
    esperarInvalido('null')
    esperarInvalido('"feira-organizada"')
  })

  it('recusa backup sem listas', () => {
    esperarInvalido(comoTexto({ ...backupValido(), listas: [] }))
    esperarInvalido(comoTexto({ ...backupValido(), listas: {} }))
  })

  it('recusa item com quantidade 0', () => {
    const dados = backupValido()
    dados.listas[0].itens[0].quantidade = 0
    esperarInvalido(comoTexto(dados))
  })

  it('recusa valor com fração de centavo', () => {
    const dados = backupValido()
    dados.listas[0].itens[0].valorUnitarioCentavos = 850.5
    esperarInvalido(comoTexto(dados))
  })

  it('recusa valor acima de R$ 99.999,99 ou negativo', () => {
    const acima = backupValido()
    acima.listas[0].itens[0].valorUnitarioCentavos = 10_000_000
    esperarInvalido(comoTexto(acima))
    const negativo = backupValido()
    negativo.listas[0].itens[0].valorUnitarioCentavos = -1
    esperarInvalido(comoTexto(negativo))
  })

  it('recusa nome de lista vazio ou com mais de 60 caracteres', () => {
    const vazio = backupValido()
    vazio.listas[0].nome = '   '
    esperarInvalido(comoTexto(vazio))
    const grande = backupValido()
    grande.listas[0].nome = 'x'.repeat(61)
    esperarInvalido(comoTexto(grande))
  })

  it('recusa descrição de item vazia ou com mais de 80 caracteres', () => {
    const vazia = backupValido()
    vazia.listas[0].itens[0].descricao = ''
    esperarInvalido(comoTexto(vazia))
    const grande = backupValido()
    grande.listas[0].itens[0].descricao = 'x'.repeat(81)
    esperarInvalido(comoTexto(grande))
  })

  it('recusa campos com tipo errado', () => {
    type Mutavel = { exportadoEm: unknown; listas: { dataCriacao: unknown; itens: Record<string, unknown>[] | null }[] }
    const casos: ((b: Mutavel) => void)[] = [
      (b) => (b.listas[0].itens![0].quantidade = '2'),
      (b) => (b.listas[0].itens![0].concluido = 1),
      (b) => (b.listas[0].itens![0].unidade = ''),
      (b) => delete b.listas[0].itens![0].descricao,
      (b) => (b.listas[0].itens = null),
      (b) => (b.listas[0].dataCriacao = '30/10/2026'),
      (b) => (b.exportadoEm = 'ontem'),
    ]
    for (const alterar of casos) {
      const dados = backupValido() as unknown as Mutavel
      alterar(dados)
      esperarInvalido(comoTexto(dados))
    }
  })

  it('recusa ids repetidos ou inválidos', () => {
    const listaRepetida = backupValido()
    listaRepetida.listas[1].id = 1
    esperarInvalido(comoTexto(listaRepetida))

    const itemRepetido = backupValido()
    itemRepetido.listas[1].itens.push({ ...itemRepetido.listas[0].itens[0] })
    esperarInvalido(comoTexto(itemRepetido))

    const idZero = backupValido()
    idZero.listas[0].id = 0
    esperarInvalido(comoTexto(idZero))

    const idFracionado = backupValido()
    idFracionado.listas[0].itens[0].id = 1.5
    esperarInvalido(comoTexto(idFracionado))
  })
})
