import { useId, useLayoutEffect, useRef, useState } from 'react'
import { NOME_LISTA_MAXIMO } from '../dominio/listas'
import { Mensagens } from '../dominio/mensagens'
import { Modal } from './Modal'

type Props = {
  aberto: boolean
  titulo: string
  nomeInicial: string
  aoSalvar: (nome: string) => void
  aoCancelar: () => void
}

// Modal "Nova lista" / "Renomear lista". Para o teclado abrir no iPhone, quem abre o modal
// deve fazê-lo dentro do próprio toque (flushSync), porque o foco acontece no useLayoutEffect.
export function ModalNomeLista({ aberto, titulo, nomeInicial, aoSalvar, aoCancelar }: Props) {
  return (
    <Modal aberto={aberto} titulo={titulo} aoVoltar={aoCancelar}>
      <FormularioNome nomeInicial={nomeInicial} aoSalvar={aoSalvar} aoCancelar={aoCancelar} />
    </Modal>
  )
}

function FormularioNome({ nomeInicial, aoSalvar, aoCancelar }: Omit<Props, 'aberto' | 'titulo'>) {
  const [nome, setNome] = useState(nomeInicial)
  const campo = useRef<HTMLInputElement>(null)
  const idCampo = useId()

  useLayoutEffect(() => {
    campo.current?.focus()
    campo.current?.select()
  }, [])

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        aoSalvar(nome)
      }}
    >
      <label className="rotulo" htmlFor={idCampo}>
        {Mensagens.listas.nomeDaLista}
      </label>
      <div className="campo">
        <span className="campo-icone" aria-hidden="true">
          ✎
        </span>
        <input
          ref={campo}
          id={idCampo}
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          maxLength={NOME_LISTA_MAXIMO}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="done"
        />
      </div>
      <button type="submit" className="btn">
        {Mensagens.geral.salvar}
      </button>
      <button type="button" className="btn-texto" onClick={aoCancelar}>
        {Mensagens.geral.cancelar}
      </button>
    </form>
  )
}
