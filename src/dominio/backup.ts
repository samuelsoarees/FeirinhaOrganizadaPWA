import { ErroBackupInvalido } from './erros'
import { validarItem, type Item } from './itens'
import { validarNomeLista, type Lista } from './listas'
import { Mensagens } from './mensagens'

export const APP_BACKUP = 'feira-organizada'
export const VERSAO_BACKUP = 1
const UNIDADE_MAXIMO = 10

export type ItemBackup = Omit<Item, 'idLista'>

export type ListaBackup = Lista & { itens: ItemBackup[] }

// Arquivo de backup: todas as listas, cada uma com todos os seus itens.
// Os ids vão junto para a importação manter a ordem dos itens, a ordem das listas e a cor do toldo.
export type Backup = {
  app: typeof APP_BACKUP
  versao: typeof VERSAO_BACKUP
  // ISO 8601 (UTC)
  exportadoEm: string
  listas: ListaBackup[]
}

export function montarBackup(listas: readonly Lista[], itens: readonly Item[], agora: Date = new Date()): Backup {
  const itensPorLista = new Map<number, ItemBackup[]>()
  for (const { idLista, ...item } of [...itens].sort((a, b) => a.id - b.id)) {
    const daLista = itensPorLista.get(idLista) ?? []
    daLista.push(item)
    itensPorLista.set(idLista, daLista)
  }
  return {
    app: APP_BACKUP,
    versao: VERSAO_BACKUP,
    exportadoEm: agora.toISOString(),
    listas: [...listas]
      .sort((a, b) => a.id - b.id)
      .map((lista) => ({ id: lista.id, nome: lista.nome, dataCriacao: lista.dataCriacao, itens: itensPorLista.get(lista.id) ?? [] })),
  }
}

export function backupParaTexto(backup: Backup): string {
  return JSON.stringify(backup, null, 2)
}

function doisDigitos(numero: number): string {
  return String(numero).padStart(2, '0')
}

// "feira-organizada-backup-2026-11-16.json", com a data do aparelho.
export function nomeArquivoBackup(hoje: Date): string {
  return Mensagens.backup.nomeArquivo(
    `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`,
  )
}

function invalido(causa?: unknown): ErroBackupInvalido {
  return new ErroBackupInvalido(Mensagens.backup.arquivoInvalido, causa)
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function ehIdValido(valor: unknown): valor is number {
  return Number.isSafeInteger(valor) && (valor as number) > 0
}

// Só aceita a data no formato que o app grava (toISOString), porque a ordenação das listas compara o texto.
function ehDataIso(valor: unknown): valor is string {
  if (typeof valor !== 'string') return false
  const data = new Date(valor)
  return !Number.isNaN(data.getTime()) && data.toISOString() === valor
}

// Aplica as mesmas regras de criar e editar; qualquer recusa vira arquivo inválido.
function comRegras<T>(validar: () => T): T {
  try {
    return validar()
  } catch (erro) {
    throw invalido(erro)
  }
}

function lerItem(valor: unknown, idsItens: Set<number>): ItemBackup {
  if (!ehObjeto(valor)) throw invalido()
  const { id, descricao, unidade, quantidade, valorUnitarioCentavos, concluido } = valor
  if (!ehIdValido(id) || idsItens.has(id)) throw invalido()
  if (typeof descricao !== 'string' || typeof quantidade !== 'number' || typeof valorUnitarioCentavos !== 'number') {
    throw invalido()
  }
  if (typeof unidade !== 'string' || unidade.trim() === '' || unidade.length > UNIDADE_MAXIMO) throw invalido()
  if (typeof concluido !== 'boolean') throw invalido()
  const valido = comRegras(() => validarItem({ descricao, quantidade, valorUnitarioCentavos }))
  idsItens.add(id)
  return { id, ...valido, unidade, concluido }
}

function lerLista(valor: unknown, idsListas: Set<number>, idsItens: Set<number>): ListaBackup {
  if (!ehObjeto(valor)) throw invalido()
  const { id, nome, dataCriacao, itens } = valor
  if (!ehIdValido(id) || idsListas.has(id)) throw invalido()
  if (typeof nome !== 'string' || !ehDataIso(dataCriacao) || !Array.isArray(itens)) throw invalido()
  const nomeValido = comRegras(() => validarNomeLista(nome))
  idsListas.add(id)
  return { id, nome: nomeValido, dataCriacao, itens: itens.map((item) => lerItem(item, idsItens)) }
}

// Lê o texto do arquivo escolhido. Qualquer problema → ErroBackupInvalido, sem nada parcial.
export function lerBackup(texto: string): Backup {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch (erro) {
    throw invalido(erro)
  }
  if (!ehObjeto(dados)) throw invalido()
  if (dados.app !== APP_BACKUP || dados.versao !== VERSAO_BACKUP) throw invalido()
  if (!ehDataIso(dados.exportadoEm)) throw invalido()
  // A exportação recusa o app sem listas, então um backup sempre traz pelo menos uma.
  if (!Array.isArray(dados.listas) || dados.listas.length === 0) throw invalido()
  const idsListas = new Set<number>()
  const idsItens = new Set<number>()
  return {
    app: APP_BACKUP,
    versao: VERSAO_BACKUP,
    exportadoEm: dados.exportadoEm,
    listas: dados.listas.map((lista) => lerLista(lista, idsListas, idsItens)),
  }
}
