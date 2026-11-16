import { useEffect, useId, useRef } from 'react'
import { Mensagens } from '../dominio/mensagens'
import { useCamada } from '../navegacao/camadas'
import './Dialog.css'

export type IconeDialog = 'alerta' | 'erro' | 'info' | 'pergunta' | 'sucesso'

export type OpcoesDialog = {
  icone: IconeDialog
  titulo: string
  mensagem: string
  textoConfirmar?: string
  // Sem texto de cancelar, o dialog tem um botão só.
  textoCancelar?: string
}

const simbolos: Record<IconeDialog, string> = {
  alerta: '!',
  erro: '✕',
  info: 'i',
  pergunta: '?',
  sucesso: '✓',
}

type Props = {
  aberto: boolean
  opcoes: OpcoesDialog
  // true quando o usuário confirma; false ao cancelar ou fechar pelo voltar.
  aoFechar: (confirmado: boolean) => void
}

export function Dialog({ aberto, opcoes, aoFechar }: Props) {
  const idTitulo = useId()
  const idMensagem = useId()
  const botaoPrincipal = useRef<HTMLButtonElement>(null)
  const temCancelar = Boolean(opcoes.textoCancelar)

  useCamada(aberto, () => aoFechar(!temCancelar))

  useEffect(() => {
    if (aberto) botaoPrincipal.current?.focus()
  }, [aberto])

  if (!aberto) return null

  return (
    <>
      <div className="overlay dialog-overlay" />
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensagem}
      >
        <div className={`dialog-icone dialog-icone--${opcoes.icone}`} aria-hidden="true">
          {simbolos[opcoes.icone]}
        </div>
        <h2 id={idTitulo} className="dialog-titulo">
          {opcoes.titulo}
        </h2>
        <p id={idMensagem} className="dialog-mensagem">
          {opcoes.mensagem}
        </p>
        <div className="dialog-botoes">
          {temCancelar && (
            <button type="button" className="dialog-botao dialog-botao--nao" onClick={() => aoFechar(false)}>
              {opcoes.textoCancelar}
            </button>
          )}
          <button
            ref={botaoPrincipal}
            type="button"
            className="dialog-botao dialog-botao--sim"
            onClick={() => aoFechar(true)}
          >
            {opcoes.textoConfirmar ?? Mensagens.geral.ok}
          </button>
        </div>
      </div>
    </>
  )
}
