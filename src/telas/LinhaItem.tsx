import type { KeyboardEvent } from 'react'
import { formatarReais } from '../dominio/formatacao'
import { subtotalCentavos, textoDetalheItem, type Item } from '../dominio/itens'
import { Mensagens } from '../dominio/mensagens'
import { useDeslizarLinha } from './useDeslizarLinha'

type Props = {
  item: Item
  revelada: boolean
  aoRevelar: (item: Item, revelada: boolean) => void
  aoEditar: (item: Item) => void
  aoExcluir: (item: Item) => void
}

export function LinhaItem({ item, revelada, aoRevelar, aoEditar, aoExcluir }: Props) {
  const { deslocamento, arrastando, handlers } = useDeslizarLinha({
    revelada,
    aoRevelar: (valor) => aoRevelar(item, valor),
    aoTocar: () => aoEditar(item),
  })

  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      aoEditar(item)
    }
  }

  return (
    <li className="item-linha" data-item-id={item.id}>
      <button
        type="button"
        className="item-excluir"
        aria-label={Mensagens.itens.excluirDe(item.descricao)}
        aria-hidden={!revelada}
        tabIndex={revelada ? 0 : -1}
        onClick={() => aoExcluir(item)}
      >
        {Mensagens.itens.excluir}
      </button>
      <div
        className={`item${item.concluido ? ' item--ok' : ''}${arrastando ? ' item--arrastando' : ''}`}
        style={{ transform: deslocamento ? `translateX(${deslocamento}px)` : undefined }}
        role="button"
        tabIndex={0}
        onKeyDown={aoTeclar}
        {...handlers}
      >
        {/* Ainda sem ação: marcar e desmarcar chegam na Etapa 4. */}
        <span className="item-marcador" aria-hidden="true" onClick={(evento) => evento.stopPropagation()}>
          ✓
        </span>
        <div className="item-info">
          <div className="item-desc">{item.descricao}</div>
          <div className="item-det">{textoDetalheItem(item)}</div>
        </div>
        <div className="item-sub">{formatarReais(subtotalCentavos(item))}</div>
      </div>
    </li>
  )
}
