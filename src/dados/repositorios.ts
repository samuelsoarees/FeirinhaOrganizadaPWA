import { BancoFeira } from './banco'
import { RepositorioBackup } from './repositorioBackup'
import { RepositorioItens } from './repositorioItens'
import { RepositorioListas } from './repositorioListas'

export type Repositorios = {
  listas: RepositorioListas
  itens: RepositorioItens
  backup: RepositorioBackup
}

export function criarRepositorios(banco: BancoFeira): Repositorios {
  return {
    listas: new RepositorioListas(banco),
    itens: new RepositorioItens(banco),
    backup: new RepositorioBackup(banco),
  }
}

let banco: BancoFeira | null = null
let repositorios: Repositorios | null = null

// Banco real do app, aberto na primeira vez que alguém precisa dele.
export function bancoPadrao(): BancoFeira {
  banco ??= new BancoFeira()
  return banco
}

export function repositoriosPadrao(): Repositorios {
  repositorios ??= criarRepositorios(bancoPadrao())
  return repositorios
}
