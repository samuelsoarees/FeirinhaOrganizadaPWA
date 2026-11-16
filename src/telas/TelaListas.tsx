import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { AvisoInstalacaoIos } from '../componentes/AvisoInstalacaoIos'
import { Carregando } from '../componentes/Carregando'
import { MenuInferior } from '../componentes/MenuInferior'
import { ModalNomeLista } from '../componentes/ModalNomeLista'
import { useDialog } from '../componentes/useDialog'
import { useOperacao } from '../componentes/useOperacao'
import { useRepositorios } from '../componentes/useRepositorios'
import { ErroNaoEncontrado } from '../dominio/erros'
import { nomeSugerido, type ResumoLista } from '../dominio/listas'
import { Mensagens } from '../dominio/mensagens'
import { abrirDetalhe } from '../navegacao/rotas'
import { pedirArmazenamentoPersistente } from '../pwa/armazenamento'
import { useOfertaInstalacao } from '../pwa/instalacao'
import { CardLista } from './CardLista'
import './TelaListas.css'

const urlBarraca = `${import.meta.env.BASE_URL}barraca.png`

type EstadoTela = { fase: 'carregando' } | { fase: 'pronta'; listas: ResumoLista[] } | { fase: 'erro' }

type EstadoModal = { modo: 'nova'; nomeInicial: string } | { modo: 'renomear'; id: number; nomeInicial: string }

export function TelaListas() {
  const repositorios = useRepositorios()
  const mostrarDialog = useDialog()
  const { executar, ocupado, mostrarIndicador } = useOperacao()
  const { oferta, instalar, dispensarIos } = useOfertaInstalacao()

  const [estado, setEstado] = useState<EstadoTela>({ fase: 'carregando' })
  const [modal, setModal] = useState<EstadoModal | null>(null)
  const [menu, setMenu] = useState<ResumoLista | null>(null)
  const rolagem = useRef<HTMLDivElement>(null)

  const carregar = useCallback(async () => {
    const resultado = await executar(() => repositorios.listas.listar(), {
      mensagemFalha: Mensagens.listas.falhaCarregar,
    })
    if (resultado.status === 'ok') setEstado({ fase: 'pronta', listas: resultado.valor })
    else if (resultado.status === 'erro') setEstado({ fase: 'erro' })
  }, [executar, repositorios])

  // Leitura inicial do banco. O executar marca `ocupado` na hora, de propósito: os toques ficam
  // bloqueados desde o início da operação (tela-listas, "Indicar carregamento").
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar()
  }, [carregar])

  // flushSync: o modal monta e foca o campo ainda dentro do toque, senão o iPhone não abre o teclado.
  const abrirNovaLista = () => {
    flushSync(() => setModal({ modo: 'nova', nomeInicial: nomeSugerido(new Date()) }))
  }

  const salvar = async (nome: string) => {
    if (!modal) return
    const modalAtual = modal
    const resultado = await executar(
      async () => {
        if (modalAtual.modo === 'nova') {
          await repositorios.listas.inserir(nome)
          void pedirArmazenamentoPersistente()
        } else {
          await repositorios.listas.renomear(modalAtual.id, nome)
        }
      },
      { mensagemFalha: Mensagens.listas.falhaSalvar },
    )
    if (resultado.status === 'ok') {
      setModal(null)
      await carregar()
      if (modalAtual.modo === 'nova' && rolagem.current) rolagem.current.scrollTop = 0
    } else if (resultado.status === 'erro' && resultado.erro instanceof ErroNaoEncontrado) {
      setModal(null)
      await carregar()
    }
    // Validação ou falha técnica: o modal continua aberto com o texto digitado.
  }

  const renomear = (lista: ResumoLista) => {
    flushSync(() => {
      setMenu(null)
      setModal({ modo: 'renomear', id: lista.id, nomeInicial: lista.nome })
    })
  }

  const excluir = async (lista: ResumoLista) => {
    setMenu(null)
    const confirmado = await mostrarDialog({
      icone: 'alerta',
      titulo: Mensagens.listas.excluirTitulo,
      mensagem: Mensagens.listas.excluirMensagem(lista.nome, lista.quantidadeItens),
      textoConfirmar: Mensagens.listas.excluir,
      textoCancelar: Mensagens.geral.cancelar,
    })
    if (!confirmado) return
    const resultado = await executar(() => repositorios.listas.excluir(lista.id), {
      mensagemFalha: Mensagens.listas.falhaExcluir,
    })
    if (resultado.status === 'ok' || (resultado.status === 'erro' && resultado.erro instanceof ErroNaoEncontrado)) {
      await carregar()
    }
  }

  const abrirLista = (lista: ResumoLista) => abrirDetalhe(lista.id)

  const listas = estado.fase === 'pronta' ? estado.listas : []
  const temListas = listas.length > 0
  const rodapeVersao = <footer className="rodape-versao">{Mensagens.listas.versao(__VERSAO_APP__)}</footer>

  return (
    <main className="tela-listas">
      <header className="topo">
        <div className="topo-textos">
          <h1>{Mensagens.listas.titulo}</h1>
          <small>{estado.fase === 'pronta' ? Mensagens.listas.subtitulo(listas.length) : ''}</small>
        </div>
        {oferta === 'android' && (
          <button type="button" className="botao-instalar" onClick={() => void instalar()}>
            {Mensagens.instalacao.instalarApp}
          </button>
        )}
      </header>

      {oferta === 'ios' && <AvisoInstalacaoIos aoDispensar={dispensarIos} />}

      {estado.fase === 'carregando' && (
        <>
          <div className="espaco" />
          {rodapeVersao}
        </>
      )}

      {estado.fase === 'pronta' && temListas && (
        <div className="conteudo" ref={rolagem} data-rolagem>
          <ul className="cards">
            {listas.map((lista) => (
              <CardLista key={lista.id} lista={lista} aoAbrir={abrirLista} aoAbrirMenu={setMenu} />
            ))}
          </ul>
          {rodapeVersao}
        </div>
      )}

      {estado.fase === 'pronta' && !temListas && (
        <>
          <section className="estado">
            <img src={urlBarraca} alt="" width={190} height={190} />
            <h2>{Mensagens.listas.vazioTitulo}</h2>
            <p>{Mensagens.listas.vazioTexto}</p>
            <div className="estado-acao">
              <button type="button" className="btn" onClick={abrirNovaLista}>
                {Mensagens.listas.criarPrimeira}
              </button>
            </div>
          </section>
          {rodapeVersao}
        </>
      )}

      {estado.fase === 'erro' && (
        <>
          <section className="estado">
            <div className="estado-icone-erro" aria-hidden="true">
              !
            </div>
            <h2>{Mensagens.listas.erroTitulo}</h2>
            <p>{Mensagens.listas.erroTexto}</p>
            <div className="estado-acao">
              <button type="button" className="btn" onClick={() => void carregar()}>
                {Mensagens.listas.tentarNovamente}
              </button>
            </div>
          </section>
          {rodapeVersao}
        </>
      )}

      {estado.fase === 'pronta' && temListas && (
        <button type="button" className="fab" aria-label={Mensagens.listas.novaLista} onClick={abrirNovaLista}>
          +
        </button>
      )}

      <MenuInferior
        aberto={menu !== null}
        titulo={menu?.nome ?? ''}
        aoFechar={() => setMenu(null)}
        opcoes={
          menu
            ? [
                { rotulo: Mensagens.listas.renomear, icone: '✎', aoEscolher: () => renomear(menu) },
                { rotulo: Mensagens.listas.excluir, icone: '🗑', perigo: true, aoEscolher: () => void excluir(menu) },
              ]
            : []
        }
      />

      <ModalNomeLista
        aberto={modal !== null}
        titulo={modal?.modo === 'renomear' ? Mensagens.listas.renomearLista : Mensagens.listas.novaLista}
        nomeInicial={modal?.nomeInicial ?? ''}
        aoSalvar={(nome) => void salvar(nome)}
        aoCancelar={() => setModal(null)}
      />

      <Carregando ocupado={ocupado} mostrarIndicador={mostrarIndicador} />
    </main>
  )
}
