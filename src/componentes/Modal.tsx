import { useId, type ReactNode } from 'react'
import { useCamada } from '../navegacao/camadas'
import './Modal.css'

type Props = {
  aberto: boolean
  titulo: string
  // Chamado pelo voltar do Android. Tocar fora do modal não fecha.
  aoVoltar: () => void
  children: ReactNode
}

export function Modal({ aberto, titulo, aoVoltar, children }: Props) {
  const idTitulo = useId()
  useCamada(aberto, aoVoltar)

  if (!aberto) return null

  return (
    <>
      <div className="overlay modal-overlay" />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <h2 id={idTitulo} className="modal-titulo">
          {titulo}
        </h2>
        {children}
      </div>
    </>
  )
}
