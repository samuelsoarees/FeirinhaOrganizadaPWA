import { useRef } from 'react'
import { Mensagens } from '../dominio/mensagens'
import { useCamada } from '../navegacao/camadas'
import './MenuInferior.css'

export type OpcaoMenu = {
  rotulo: string
  icone: string
  perigo?: boolean
  aoEscolher: () => void
}

type Props = {
  aberto: boolean
  titulo: string
  opcoes: OpcaoMenu[]
  // "Cancelar", toque fora ou voltar do Android.
  aoFechar: () => void
}

// Painel de opções que sobe da parte de baixo da tela (action sheet).
export function MenuInferior({ aberto, titulo, opcoes, aoFechar }: Props) {
  useCamada(aberto, aoFechar)
  // Só fecha se o toque começou no fundo: no iPhone, o toque longo que abriu o menu
  // termina com um click que cairia no fundo recém-aberto.
  const toqueComecouNoFundo = useRef(false)

  if (!aberto) return null

  return (
    <>
      <div
        className="overlay menu-overlay"
        data-testid="fundo-menu"
        onPointerDown={() => {
          toqueComecouNoFundo.current = true
        }}
        onClick={() => {
          if (toqueComecouNoFundo.current) aoFechar()
          toqueComecouNoFundo.current = false
        }}
      />
      <div className="menu-inferior" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="menu-alca" aria-hidden="true" />
        <div className="menu-titulo">{titulo}</div>
        {opcoes.map((opcao) => (
          <button
            key={opcao.rotulo}
            type="button"
            className={`menu-opcao${opcao.perigo ? ' menu-opcao--perigo' : ''}`}
            onClick={opcao.aoEscolher}
          >
            <span aria-hidden="true">{opcao.icone}</span>
            {opcao.rotulo}
          </button>
        ))}
        <button type="button" className="btn-texto" onClick={aoFechar}>
          {Mensagens.geral.cancelar}
        </button>
      </div>
    </>
  )
}
