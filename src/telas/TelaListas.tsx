import { AvisoInstalacaoIos } from '../componentes/AvisoInstalacaoIos'
import { useDialog } from '../componentes/useDialog'
import { Mensagens } from '../dominio/mensagens'
import { useOfertaInstalacao } from '../pwa/instalacao'
import './TelaListas.css'

const urlBarraca = `${import.meta.env.BASE_URL}barraca.png`

// Casca da Etapa 1: só o estado vazio estático. A leitura das listas chega na Etapa 2.
export function TelaListas() {
  const mostrarDialog = useDialog()
  const { oferta, instalar, dispensarIos } = useOfertaInstalacao()

  const criarPrimeiraLista = () => {
    void mostrarDialog({
      icone: 'info',
      titulo: Mensagens.geral.emBreve,
      mensagem: Mensagens.listas.criarEmBreve,
    })
  }

  return (
    <main className="tela-listas">
      <header className="topo">
        <div className="topo-textos">
          <h1>{Mensagens.listas.titulo}</h1>
          <small>{Mensagens.listas.subtituloNenhuma}</small>
        </div>
        {oferta === 'android' && (
          <button type="button" className="botao-instalar" onClick={() => void instalar()}>
            {Mensagens.instalacao.instalarApp}
          </button>
        )}
      </header>

      {oferta === 'ios' && <AvisoInstalacaoIos aoDispensar={dispensarIos} />}

      <section className="estado">
        <img src={urlBarraca} alt="" width={190} height={190} />
        <h2>{Mensagens.listas.vazioTitulo}</h2>
        <p>{Mensagens.listas.vazioTexto}</p>
        <div className="estado-acao">
          <button type="button" className="btn" onClick={criarPrimeiraLista}>
            {Mensagens.listas.criarPrimeira}
          </button>
        </div>
      </section>

      <footer className="rodape-versao">{Mensagens.listas.versao(__VERSAO_APP__)}</footer>
    </main>
  )
}
