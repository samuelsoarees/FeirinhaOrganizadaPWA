import { erroItemNaoEncontrado, ordenarItens, UNIDADE_PADRAO, validarItem, type DadosItem, type Item } from '../dominio/itens'
import { erroListaNaoEncontrada } from '../dominio/listas'
import type { BancoFeira, RegistroItem } from './banco'
import { protegido } from './protegido'

function paraItem(registro: RegistroItem): Item {
  return { ...registro, concluido: registro.concluido === 1 }
}

export class RepositorioItens {
  private readonly banco: BancoFeira

  constructor(banco: BancoFeira) {
    this.banco = banco
  }

  // Itens da lista na ordem de exibição: pendentes e depois concluídos, cada grupo na ordem de inclusão.
  listar(idLista: number): Promise<Item[]> {
    return protegido('listar', async () => {
      const registros = await this.banco.itens.where('idLista').equals(idLista).toArray()
      return ordenarItens(registros.map(paraItem))
    })
  }

  // Devolve o id do item criado. A lista precisa existir no momento da gravação.
  async inserir(idLista: number, dados: DadosItem): Promise<number> {
    const valido = validarItem(dados)
    return protegido('salvar', () =>
      this.banco.transaction('rw', this.banco.listas, this.banco.itens, async () => {
        const lista = await this.banco.listas.get(idLista)
        if (!lista) throw erroListaNaoEncontrada()
        return this.banco.itens.add({
          idLista,
          descricao: valido.descricao,
          unidade: UNIDADE_PADRAO,
          quantidade: valido.quantidade,
          valorUnitarioCentavos: valido.valorUnitarioCentavos,
          concluido: 0,
        } as RegistroItem)
      }),
    )
  }

  // Troca descrição, quantidade e valor. Lista, posição de inclusão (id) e concluído ficam como estão.
  async editar(id: number, dados: DadosItem): Promise<void> {
    const valido = validarItem(dados)
    await protegido('salvar', async () => {
      const alterados = await this.banco.itens.update(id, {
        descricao: valido.descricao,
        quantidade: valido.quantidade,
        valorUnitarioCentavos: valido.valorUnitarioCentavos,
      })
      if (alterados === 0) throw erroItemNaoEncontrado()
    })
  }

  // Grava só a marcação de concluído. Descrição, quantidade, valor e posição de inclusão (id) ficam como estão.
  async marcar(id: number, concluido: boolean): Promise<void> {
    await protegido('marcar', async () => {
      const alterados = await this.banco.itens.update(id, { concluido: concluido ? 1 : 0 })
      if (alterados === 0) throw erroItemNaoEncontrado()
    })
  }

  async excluir(id: number): Promise<void> {
    await protegido('excluir', () =>
      this.banco.transaction('rw', this.banco.itens, async () => {
        const existe = await this.banco.itens.get(id)
        if (!existe) throw erroItemNaoEncontrado()
        await this.banco.itens.delete(id)
      }),
    )
  }
}
