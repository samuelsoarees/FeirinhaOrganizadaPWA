import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Carregando } from '../componentes/Carregando'
import { MenuInferior } from '../componentes/MenuInferior'
import { ModalNomeLista } from '../componentes/ModalNomeLista'
import { PainelItem } from '../componentes/PainelItem'
import { useDialog } from '../componentes/useDialog'
import { useOperacao } from '../componentes/useOperacao'
import { useRepositorios } from '../componentes/useRepositorios'
import { ErroNaoEncontrado } from '../dominio/erros'
import { formatarReais } from '../dominio/formatacao'
import { ordenarItens, progressoConcluido, textoResumoRodape, type DadosItem, type Item } from '../dominio/itens'
import { resumirItens, type Lista } from '../dominio/listas'
import { Mensagens } from '../dominio/mensagens'
import { usePilhaCamadas } from '../navegacao/camadas'
import { voltarParaListas } from '../navegacao/rotas'
import { LinhaItem } from './LinhaItem'
import { useAnimacaoFlip } from './useAnimacaoFlip'
import './TelaDetalheLista.css'

type EstadoTela =
  | { fase: 'carregando' }
  | { fase: 'pronta'; lista: Lista; itens: Item[] }
  | { fase: 'erro' }

type EstadoPainel = { modo: 'novo' } | { modo: 'editar'; item: Item }

export function TelaDetalheLista({ idLista }: { idLista: number }) {
  const repositorios = useRepositorios()
  const mostrarDialog = useDialog()
  const pilha = usePilhaCamadas()
  const { executar, ocupado, mostrarIndicador } = useOperacao()

  const [estado, setEstado] = useState<EstadoTela>({ fase: 'carregando' })
  const [painel, setPainel] = useState<EstadoPainel | null>(null)
  const [renomeando, setRenomeando] = useState(false)
  const [menuOpcoes, setMenuOpcoes] = useState(false)
  const [revelado, setRevelado] = useState<number | null>(null)
  const saindo = useRef(false)

  // Lista que deixou de existir: depois do "Atenção", volta para Listas.
  const sairListaInexistente = useCallback(
    async (dialogFechado: Promise<boolean>) => {
      if (saindo.current) return
      saindo.current = true
      setPainel(null)
      setRenomeando(false)
      await dialogFechado
      await pilha.aguardarSemCamadas()
      voltarParaListas()
    },
    [pilha],
  )

  const carregar = useCallback(async () => {
    const resultado = await executar(
      async () => {
        const lista = await repositorios.listas.obter(idLista)
        const itens = await repositorios.itens.listar(idLista)
        return { lista, itens }
      },
      { mensagemFalha: Mensagens.detalhe.falhaCarregar },
    )
    if (resultado.status === 'ok') {
      setEstado({ fase: 'pronta', ...resultado.valor })
    } else if (resultado.status === 'erro') {
      if (resultado.erro instanceof ErroNaoEncontrado) await sairListaInexistente(resultado.dialogFechado)
      else setEstado({ fase: 'erro' })
    }
  }, [executar, repositorios, idLista, sairListaInexistente])

  // Leitura inicial. O executar marca `ocupado` na hora: toques e voltar ficam bloqueados desde o início.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar()
  }, [carregar])

  // Com o "Excluir" de uma linha revelado, tocar em qualquer outro lugar só esconde o botão.
  // O toque numa outra linha, nesse caso, não abre a edição dela.
  const ignorarCliqueNaLinha = useRef(false)
  const reveladoAtual = useRef(revelado)
  useEffect(() => {
    reveladoAtual.current = revelado
  }, [revelado])
  useEffect(() => {
    const aoTocar = (evento: PointerEvent) => {
      ignorarCliqueNaLinha.current = false
      if (reveladoAtual.current === null) return
      const alvo = evento.target instanceof Element ? evento.target : null
      if (alvo?.closest(`[data-item-id="${reveladoAtual.current}"]`)) return
      ignorarCliqueNaLinha.current = Boolean(alvo?.closest('.item'))
      setRevelado(null)
    }
    document.addEventListener('pointerdown', aoTocar, true)
    return () => document.removeEventListener('pointerdown', aoTocar, true)
  }, [])

  const tratarNaoEncontrado = async (erro: ErroNaoEncontrado, dialogFechado: Promise<boolean>) => {
    setPainel(null)
    if (erro.alvo === 'lista') await sairListaInexistente(dialogFechado)
    else await carregar()
  }

  // flushSync: o painel monta e foca a descrição ainda dentro do toque, senão o iPhone não abre o teclado.
  const abrirNovoItem = () => {
    setRevelado(null)
    flushSync(() => setPainel({ modo: 'novo' }))
  }

  const abrirEdicao = (item: Item) => {
    if (ignorarCliqueNaLinha.current) {
      ignorarCliqueNaLinha.current = false
      return
    }
    setPainel({ modo: 'editar', item })
  }

  const salvarItem = async (dados: DadosItem) => {
    if (!painel) return
    const painelAtual = painel
    const resultado = await executar(
      async () => {
        if (painelAtual.modo === 'novo') await repositorios.itens.inserir(idLista, dados)
        else await repositorios.itens.editar(painelAtual.item.id, dados)
      },
      { mensagemFalha: Mensagens.itens.falhaSalvar },
    )
    if (resultado.status === 'ok') {
      setPainel(null)
      await carregar()
    } else if (resultado.status === 'erro' && resultado.erro instanceof ErroNaoEncontrado) {
      await tratarNaoEncontrado(resultado.erro, resultado.dialogFechado)
    }
    // Validação ou falha técnica: o painel continua aberto com os valores digitados.
  }

  const excluirItem = async (item: Item) => {
    setRevelado(null)
    const confirmado = await mostrarDialog({
      icone: 'alerta',
      titulo: Mensagens.itens.excluirTitulo,
      mensagem: Mensagens.itens.excluirMensagem(item.descricao),
      textoConfirmar: Mensagens.itens.excluir,
      textoCancelar: Mensagens.geral.cancelar,
    })
    if (!confirmado) return
    const resultado = await executar(() => repositorios.itens.excluir(item.id), {
      mensagemFalha: Mensagens.itens.falhaExcluir,
    })
    if (resultado.status === 'ok') {
      setPainel(null)
      await carregar()
    } else if (resultado.status === 'erro' && resultado.erro instanceof ErroNaoEncontrado) {
      await tratarNaoEncontrado(resultado.erro, resultado.dialogFechado)
    }
    // Falha técnica: o item continua na tela (e o painel, se a exclusão veio dele).
  }

  // Grava na hora, sem abrir o painel. A tela só troca o marcador depois que o banco confirmou:
  // numa falha, o "Ops!" aparece e o item continua como estava. Enquanto grava, outros toques
  // ficam bloqueados, então a tela nunca mostra uma marcação diferente da que está no banco.
  const marcarItem = async (item: Item) => {
    if (ignorarCliqueNaLinha.current) {
      ignorarCliqueNaLinha.current = false
      return
    }
    const concluido = !item.concluido
    const resultado = await executar(() => repositorios.itens.marcar(item.id, concluido), {
      mensagemFalha: Mensagens.itens.falhaMarcar,
    })
    if (resultado.status === 'ok') {
      setEstado((atual) =>
        atual.fase === 'pronta'
          ? {
              ...atual,
              itens: ordenarItens(atual.itens.map((outro) => (outro.id === item.id ? { ...outro, concluido } : outro))),
            }
          : atual,
      )
    } else if (resultado.status === 'erro' && resultado.erro instanceof ErroNaoEncontrado) {
      await tratarNaoEncontrado(resultado.erro, resultado.dialogFechado)
    }
  }

  const abrirOpcoes = () => {
    setRevelado(null)
    setMenuOpcoes(true)
  }

  const abrirRenomear = () => {
    flushSync(() => setRenomeando(true))
  }

  const renomear = async (nome: string) => {
    const resultado = await executar(() => repositorios.listas.renomear(idLista, nome), {
      mensagemFalha: Mensagens.listas.falhaSalvar,
    })
    if (resultado.status === 'ok') {
      setRenomeando(false)
      await carregar()
    } else if (resultado.status === 'erro' && resultado.erro instanceof ErroNaoEncontrado) {
      await sairListaInexistente(resultado.dialogFechado)
    }
  }

  const aoRevelar = (item: Item, valor: boolean) => {
    setRevelado(valor ? item.id : (atual) => (atual === item.id ? null : atual))
  }

  const lista = estado.fase === 'pronta' ? estado.lista : null
  const itens = estado.fase === 'pronta' ? estado.itens : []
  const pendentes = itens.filter((item) => !item.concluido)
  const concluidos = itens.filter((item) => item.concluido)
  const totais = resumirItens(itens)
  const listaItens = useRef<HTMLUListElement>(null)
  useAnimacaoFlip(listaItens, itens)

  const linha = (item: Item) => (
    <LinhaItem
      key={item.id}
      item={item}
      revelada={revelado === item.id}
      aoRevelar={aoRevelar}
      aoEditar={abrirEdicao}
      aoExcluir={(alvo) => void excluirItem(alvo)}
      aoMarcar={(alvo) => void marcarItem(alvo)}
    />
  )

  return (
    <main className="tela-detalhe">
      <header className="topo-detalhe">
        <button type="button" className="topo-detalhe-voltar" aria-label={Mensagens.geral.voltar} onClick={voltarParaListas}>
          ‹
        </button>
        <h1>{lista?.nome ?? ''}</h1>
        <button
          type="button"
          className="topo-detalhe-acao"
          aria-label={Mensagens.detalhe.renomearLista}
          disabled={!lista}
          onClick={abrirRenomear}
        >
          ✎
        </button>
        <button
          type="button"
          className="topo-detalhe-acao topo-detalhe-mais"
          aria-label={Mensagens.detalhe.opcoesDaLista}
          disabled={!lista}
          onClick={abrirOpcoes}
        >
          ⋯
        </button>
      </header>

      {estado.fase === 'carregando' && <div className="espaco" />}

      {estado.fase === 'pronta' && itens.length > 0 && (
        <div className="itens" data-rolagem>
          <ul className="itens-lista" ref={listaItens}>
            {pendentes.map(linha)}
            {concluidos.length > 0 && <li className="itens-grupo" data-flip="grupo">{Mensagens.detalhe.concluidos(concluidos.length)}</li>}
            {concluidos.map(linha)}
          </ul>
        </div>
      )}

      {estado.fase === 'pronta' && itens.length === 0 && <p className="itens-vazio">{Mensagens.detalhe.vazio}</p>}

      {estado.fase === 'erro' && (
        <section className="estado">
          <div className="estado-icone-erro" aria-hidden="true">
            !
          </div>
          <h2>{Mensagens.detalhe.erroTitulo}</h2>
          <p>{Mensagens.detalhe.erroTexto}</p>
          <div className="estado-acao">
            <button type="button" className="btn" onClick={() => void carregar()}>
              {Mensagens.detalhe.tentarNovamente}
            </button>
          </div>
        </section>
      )}

      {estado.fase === 'pronta' && (
        <footer className="rodape-total">
          <div className="rodape-total-linha">
            <span>{Mensagens.detalhe.totalConcluido}</span>
            <strong>{formatarReais(totais.totalConcluidoCentavos)}</strong>
          </div>
          <div
            className="progresso"
            role="progressbar"
            aria-label={Mensagens.detalhe.progresso}
            aria-valuemin={0}
            aria-valuemax={totais.quantidadeItens}
            aria-valuenow={totais.quantidadeConcluidos}
          >
            <i style={{ width: `${progressoConcluido(totais) * 100}%` }} />
          </div>
          <div className="rodape-total-resumo">{textoResumoRodape(totais)}</div>
          <button type="button" className="btn" onClick={abrirNovoItem}>
            {Mensagens.detalhe.adicionarItem}
          </button>
        </footer>
      )}

      <PainelItem
        aberto={painel !== null}
        modo={painel?.modo ?? 'novo'}
        inicial={painel?.modo === 'editar' ? painel.item : undefined}
        aoSalvar={(dados) => void salvarItem(dados)}
        aoCancelar={() => setPainel(null)}
        aoExcluir={painel?.modo === 'editar' ? () => void excluirItem(painel.item) : undefined}
      />

      <MenuInferior
        aberto={menuOpcoes}
        titulo={Mensagens.detalhe.opcoesDaLista}
        aoFechar={() => setMenuOpcoes(false)}
        opcoes={[
          { rotulo: Mensagens.detalhe.desmarcarTodos, icone: '○', aoEscolher: () => setMenuOpcoes(false) },
          { rotulo: Mensagens.detalhe.zerarPrecos, icone: '⊘', perigo: true, aoEscolher: () => setMenuOpcoes(false) },
        ]}
      />

      <ModalNomeLista
        aberto={renomeando}
        titulo={Mensagens.listas.renomearLista}
        nomeInicial={lista?.nome ?? ''}
        aoSalvar={(nome) => void renomear(nome)}
        aoCancelar={() => setRenomeando(false)}
      />

      <Carregando ocupado={ocupado} mostrarIndicador={mostrarIndicador} />
    </main>
  )
}
