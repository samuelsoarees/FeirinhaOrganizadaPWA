import { Dexie, type EntityTable } from 'dexie'

export type RegistroLista = {
  id: number
  nome: string
  // ISO 8601 (UTC)
  dataCriacao: string
}

export type RegistroItem = {
  id: number
  idLista: number
  descricao: string
  unidade: string
  quantidade: number
  valorUnitarioCentavos: number
  // 0/1 em vez de boolean: IndexedDB não indexa boolean.
  concluido: 0 | 1
}

export const NOME_BANCO = 'feira-organizada'

// Cada mudança de schema é uma nova version(n+1) com upgrade.
// NUNCA edite uma versão já publicada: os usuários perderiam dados.
export class BancoFeira extends Dexie {
  listas!: EntityTable<RegistroLista, 'id'>
  itens!: EntityTable<RegistroItem, 'id'>

  constructor(nome: string = NOME_BANCO) {
    super(nome)
    this.version(1).stores({
      listas: '++id, dataCriacao',
      itens: '++id, idLista, [idLista+concluido]',
    })
  }
}
