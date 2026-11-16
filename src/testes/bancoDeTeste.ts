import { BancoFeira, type RegistroItem } from '../dados/banco'
import { criarRepositorios, type Repositorios } from '../dados/repositorios'

let contador = 0

// Banco novo e vazio a cada chamada, para os testes não se enxergarem.
export function criarBancoDeTeste(): { banco: BancoFeira; repositorios: Repositorios } {
  contador++
  const banco = new BancoFeira(`teste-${contador}-${Math.random().toString(36).slice(2)}`)
  return { banco, repositorios: criarRepositorios(banco) }
}

export async function inserirItens(
  banco: BancoFeira,
  idLista: number,
  itens: { quantidade: number; valorUnitarioCentavos: number; concluido: boolean }[],
): Promise<void> {
  await banco.itens.bulkAdd(
    itens.map(
      (item, i): Omit<RegistroItem, 'id'> => ({
        idLista,
        descricao: `Item ${i + 1}`,
        unidade: 'UN',
        quantidade: item.quantidade,
        valorUnitarioCentavos: item.valorUnitarioCentavos,
        concluido: item.concluido ? 1 : 0,
      }),
    ) as RegistroItem[],
  )
}
