import type { CSSProperties, KeyboardEvent } from 'react'
import { formatarData, formatarReais } from '../dominio/formatacao'
import { corDoToldo, type ResumoLista } from '../dominio/listas'
import { Mensagens } from '../dominio/mensagens'
import { useToqueCard } from './useToqueCard'

type Props = {
  lista: ResumoLista
  aoAbrir: (lista: ResumoLista) => void
  aoAbrirMenu: (lista: ResumoLista) => void
}

export function CardLista({ lista, aoAbrir, aoAbrirMenu }: Props) {
  const { pressionado, handlers } = useToqueCard({
    aoTocar: () => aoAbrir(lista),
    aoTocarLongo: () => aoAbrirMenu(lista),
  })

  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      aoAbrir(lista)
    }
  }

  const resumo = Mensagens.listas.resumoItens(lista.quantidadeConcluidos, lista.quantidadeItens)

  return (
    <li
      className={`card${pressionado ? ' card--pressionado' : ''}`}
      style={{ '--faixa': corDoToldo(lista.id) } as CSSProperties}
    >
      <div className="card-toque" role="button" tabIndex={0} onKeyDown={aoTeclar} {...handlers}>
        <div className="card-info">
          <div className="card-nome">{lista.nome}</div>
          <div className="card-meta">
            {formatarData(new Date(lista.dataCriacao))} · {resumo}
          </div>
        </div>
        <div className="card-valor">
          {formatarReais(lista.totalConcluidoCentavos)}
          <small>{Mensagens.listas.legendaConcluido}</small>
        </div>
      </div>
      <button
        type="button"
        className="card-mais"
        aria-label={Mensagens.listas.opcoesDe(lista.nome)}
        onClick={() => aoAbrirMenu(lista)}
      >
        ⋮
      </button>
    </li>
  )
}
