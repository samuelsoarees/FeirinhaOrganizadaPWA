import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { formatarNumeroReais, formatarReais } from '../dominio/formatacao'
import {
  centavosDoTextoDigitado,
  DESCRICAO_ITEM_MAXIMO,
  QUANTIDADE_MAXIMA,
  QUANTIDADE_MINIMA,
  type DadosItem,
} from '../dominio/itens'
import { Mensagens } from '../dominio/mensagens'
import { PainelInferior } from './PainelInferior'
import './PainelItem.css'

export type ModoPainelItem = 'novo' | 'editar'

type Props = {
  aberto: boolean
  modo: ModoPainelItem
  // Dados atuais do item, na edição.
  inicial?: DadosItem
  aoSalvar: (dados: DadosItem) => void
  aoCancelar: () => void
  // Só na edição.
  aoExcluir?: () => void
}

const QUANTIDADE_DIGITOS = String(QUANTIDADE_MAXIMA).length

// Painel "Novo item" / "Editar item". No "Novo item", quem abre deve fazê-lo dentro do
// próprio toque (flushSync), para o foco na descrição abrir o teclado do iPhone.
export function PainelItem({ aberto, modo, inicial, aoSalvar, aoCancelar, aoExcluir }: Props) {
  return (
    <PainelInferior
      aberto={aberto}
      titulo={modo === 'novo' ? Mensagens.itens.novoItem : Mensagens.itens.editarItem}
      aoVoltar={aoCancelar}
    >
      <FormularioItem modo={modo} inicial={inicial} aoSalvar={aoSalvar} aoCancelar={aoCancelar} aoExcluir={aoExcluir} />
    </PainelInferior>
  )
}

function FormularioItem({ modo, inicial, aoSalvar, aoCancelar, aoExcluir }: Omit<Props, 'aberto'>) {
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  // Texto, para o campo poder ficar vazio enquanto o usuário digita outra quantidade.
  const [quantidade, setQuantidade] = useState(String(inicial?.quantidade ?? QUANTIDADE_MINIMA))
  const [valorCentavos, setValorCentavos] = useState(inicial?.valorUnitarioCentavos ?? 0)
  const campoDescricao = useRef<HTMLInputElement>(null)
  const campoValor = useRef<HTMLInputElement>(null)
  const idDescricao = useId()
  const idQuantidade = useId()
  const idValor = useId()

  useLayoutEffect(() => {
    if (modo === 'novo') campoDescricao.current?.focus()
  }, [modo])

  const quantidadeNumero = quantidade === '' ? Number.NaN : Number(quantidade)
  const subtotal = Number.isInteger(quantidadeNumero) ? quantidadeNumero * valorCentavos : 0

  const passo = (delta: number) => {
    const atual = Number.isInteger(quantidadeNumero) ? quantidadeNumero : QUANTIDADE_MINIMA
    const nova = Math.min(QUANTIDADE_MAXIMA, Math.max(QUANTIDADE_MINIMA, atual + delta))
    setQuantidade(String(nova))
  }

  const aoDigitarValor = (texto: string) => {
    const centavos = centavosDoTextoDigitado(texto)
    if (centavos !== null) setValorCentavos(centavos)
  }

  // O cursor fica sempre no fim: os dígitos entram pela direita, como em app de banco.
  const cursorNoFim = () => {
    const campo = campoValor.current
    if (!campo) return
    const fim = campo.value.length
    if (campo.selectionStart !== fim || campo.selectionEnd !== fim) campo.setSelectionRange(fim, fim)
  }

  const aoTeclarDescricao = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    campoValor.current?.focus()
  }

  return (
    <form
      className="form-item"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault()
        aoSalvar({ descricao, quantidade: quantidadeNumero, valorUnitarioCentavos: valorCentavos })
      }}
    >
      <label className="rotulo" htmlFor={idDescricao}>
        {Mensagens.itens.descricao}
      </label>
      <div className="campo">
        <span className="campo-icone" aria-hidden="true">
          🛒
        </span>
        <input
          ref={campoDescricao}
          id={idDescricao}
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          onKeyDown={aoTeclarDescricao}
          maxLength={DESCRICAO_ITEM_MAXIMO}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="next"
        />
      </div>

      <div className="form-item-linha">
        <div>
          <label className="rotulo" htmlFor={idQuantidade}>
            {Mensagens.itens.quantidade}
          </label>
          <div className="campo campo-stepper">
            <button
              type="button"
              className="stepper-botao"
              aria-label={Mensagens.itens.diminuirQuantidade}
              onClick={() => passo(-1)}
            >
              –
            </button>
            <input
              id={idQuantidade}
              value={quantidade}
              onChange={(evento) => setQuantidade(evento.target.value.replace(/\D/g, '').slice(0, QUANTIDADE_DIGITOS))}
              onFocus={(evento) => evento.target.select()}
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="next"
            />
            <button
              type="button"
              className="stepper-botao"
              aria-label={Mensagens.itens.aumentarQuantidade}
              onClick={() => passo(1)}
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="rotulo" htmlFor={idValor}>
            {Mensagens.itens.valorUnitario}
          </label>
          <div className="campo">
            <span className="campo-prefixo" aria-hidden="true">
              {Mensagens.itens.simboloMoeda}
            </span>
            <input
              ref={campoValor}
              id={idValor}
              value={formatarNumeroReais(valorCentavos)}
              onChange={(evento) => aoDigitarValor(evento.target.value)}
              onFocus={cursorNoFim}
              onClick={cursorNoFim}
              onSelect={cursorNoFim}
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
            />
          </div>
        </div>
      </div>

      <div className="form-item-subtotal">
        <span>{Mensagens.itens.subtotal}</span>
        <strong>{formatarReais(subtotal)}</strong>
      </div>

      <button type="submit" className="btn">
        {Mensagens.itens.salvarItem}
      </button>
      {aoExcluir && (
        <button type="button" className="btn-perigo" onClick={aoExcluir}>
          {Mensagens.itens.excluirItem}
        </button>
      )}
      <button type="button" className="btn-texto" onClick={aoCancelar}>
        {Mensagens.geral.cancelar}
      </button>
    </form>
  )
}
