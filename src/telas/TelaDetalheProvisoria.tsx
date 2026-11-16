import { Mensagens } from '../dominio/mensagens'
import { navegar } from '../navegacao/rotas'
import './TelaDetalheProvisoria.css'

// Tela provisória: o detalhe de verdade chega na Etapa 3.
export function TelaDetalheProvisoria({ idLista }: { idLista: string }) {
  return (
    <main className="tela-detalhe-provisoria">
      <header className="detalhe-topo">
        <button
          type="button"
          className="detalhe-voltar"
          aria-label={Mensagens.geral.voltar}
          onClick={() => navegar({ tela: 'listas' })}
        >
          ‹
        </button>
        <h1>{Mensagens.detalheProvisorio.titulo(idLista)}</h1>
      </header>
      <p className="detalhe-texto">{Mensagens.detalheProvisorio.texto}</p>
    </main>
  )
}
