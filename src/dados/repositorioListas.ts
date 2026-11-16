import { compararListas, erroListaNaoEncontrada, resumirItens, validarNomeLista, type Lista, type ResumoLista } from '../dominio/listas'
import type { BancoFeira } from './banco'
import { protegido } from './protegido'

export class RepositorioListas {
  private readonly banco: BancoFeira

  constructor(banco: BancoFeira) {
    this.banco = banco
  }

  listar(): Promise<ResumoLista[]> {
    return protegido('listar', () =>
      this.banco.transaction('r', this.banco.listas, this.banco.itens, async () => {
        const [listas, itens] = await Promise.all([this.banco.listas.toArray(), this.banco.itens.toArray()])
        const itensPorLista = new Map<number, { quantidade: number; valorUnitarioCentavos: number; concluido: boolean }[]>()
        for (const item of itens) {
          const daLista = itensPorLista.get(item.idLista) ?? []
          daLista.push({
            quantidade: item.quantidade,
            valorUnitarioCentavos: item.valorUnitarioCentavos,
            concluido: item.concluido === 1,
          })
          itensPorLista.set(item.idLista, daLista)
        }
        return listas
          .sort(compararListas)
          .map((lista) => ({ ...lista, ...resumirItens(itensPorLista.get(lista.id) ?? []) }))
      }),
    )
  }

  // Lista que não existe mais → ErroNaoEncontrado.
  obter(id: number): Promise<Lista> {
    return protegido('listar', async () => {
      const lista = await this.banco.listas.get(id)
      if (!lista) throw erroListaNaoEncontrada()
      return lista
    })
  }

  // Devolve o id da lista criada.
  async inserir(nome: string, agora: Date = new Date()): Promise<number> {
    const nomeValido = validarNomeLista(nome)
    return protegido('salvar', () =>
      this.banco.listas.add({ nome: nomeValido, dataCriacao: agora.toISOString() }),
    )
  }

  async renomear(id: number, nome: string): Promise<void> {
    const nomeValido = validarNomeLista(nome)
    await protegido('salvar', async () => {
      const alterados = await this.banco.listas.update(id, { nome: nomeValido })
      if (alterados === 0) throw erroListaNaoEncontrada()
    })
  }

  // Apaga a lista e os itens dela numa transação só: ou tudo, ou nada.
  async excluir(id: number): Promise<void> {
    await protegido('excluir', () =>
      this.banco.transaction('rw', this.banco.listas, this.banco.itens, async () => {
        const existe = await this.banco.listas.get(id)
        if (!existe) throw erroListaNaoEncontrada()
        await this.banco.itens.where('idLista').equals(id).delete()
        await this.banco.listas.delete(id)
      }),
    )
  }
}
