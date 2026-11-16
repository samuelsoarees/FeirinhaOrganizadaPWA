import { useId, type KeyboardEvent } from 'react'
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
  aoMarcar: (item: Item) => void
}

export function LinhaItem({ item, revelada, aoRevelar, aoEditar, aoExcluir, aoMarcar }: Props) {
  const id = useId()
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
    <li className="item-linha" data-item-id={item.id} data-flip={`item-${item.id}`}>
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
        // O nome da linha é o do item; o marcador tem o próprio nome e não entra nele.
        aria-labelledby={`${id}-desc ${id}-det ${id}-sub`}
        onKeyDown={aoTeclar}
        {...handlers}
      >
        {/* O toque no marcador não chega à linha: marca ou desmarca sem abrir o painel. */}
        <button
          type="button"
          className="item-marcador"
          role="checkbox"
          aria-checked={item.concluido}
          aria-label={Mensagens.itens.marcarComoConcluido(item.descricao)}
          onKeyDown={(evento) => evento.stopPropagation()}
          onClick={(evento) => {
            evento.stopPropagation()
            if (revelada) aoRevelar(item, false)
            else aoMarcar(item)
          }}
        >
          <span aria-hidden="true">✓</span>
        </button>
        <div className="item-info">
          <div className="item-desc" id={`${id}-desc`}>
            {item.descricao}
          </div>
          <div className="item-det" id={`${id}-det`}>
            {textoDetalheItem(item)}
          </div>
        </div>
        <div className="item-sub" id={`${id}-sub`}>
          {formatarReais(subtotalCentavos(item))}
        </div>
      </div>
    </li>
  )
}
