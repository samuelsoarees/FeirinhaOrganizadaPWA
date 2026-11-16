import { montarBackup, type Backup } from '../dominio/backup'
import type { BancoFeira, RegistroItem } from './banco'
import { protegido } from './protegido'

export class RepositorioBackup {
  private readonly banco: BancoFeira

  constructor(banco: BancoFeira) {
    this.banco = banco
  }

  // Lê todas as listas e todos os itens numa leitura só, para o arquivo não misturar estados.
  exportar(agora: Date = new Date()): Promise<Backup> {
    return protegido('exportar', () =>
      this.banco.transaction('r', this.banco.listas, this.banco.itens, async () => {
        const [listas, itens] = await Promise.all([this.banco.listas.toArray(), this.banco.itens.toArray()])
        return montarBackup(
          listas,
          itens.map((item) => ({ ...item, concluido: item.concluido === 1 })),
          agora,
        )
      }),
    )
  }

  contarListas(): Promise<number> {
    return protegido('listar', () => this.banco.listas.count())
  }

  // Troca tudo pelo conteúdo do backup (já validado) numa transação só: se algo falhar, nada muda.
  async importar(backup: Backup): Promise<void> {
    await protegido('importar', () =>
      this.banco.transaction('rw', this.banco.listas, this.banco.itens, async () => {
        await this.banco.itens.clear()
        await this.banco.listas.clear()
        await this.banco.listas.bulkAdd(
          backup.listas.map(({ id, nome, dataCriacao }) => ({ id, nome, dataCriacao })),
        )
        await this.banco.itens.bulkAdd(
          backup.listas.flatMap((lista) =>
            lista.itens.map(
              (item): RegistroItem => ({
                id: item.id,
                idLista: lista.id,
                descricao: item.descricao,
                unidade: item.unidade,
                quantidade: item.quantidade,
                valorUnitarioCentavos: item.valorUnitarioCentavos,
                concluido: item.concluido ? 1 : 0,
              }),
            ),
          ),
        )
      }),
    )
  }
}
