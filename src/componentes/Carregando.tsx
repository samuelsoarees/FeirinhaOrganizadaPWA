import { Mensagens } from '../dominio/mensagens'
import './Carregando.css'

// Enquanto `ocupado`, uma camada transparente engole os toques; o indicador só aparece com `mostrarIndicador`.
export function Carregando({ ocupado, mostrarIndicador }: { ocupado: boolean; mostrarIndicador: boolean }) {
  if (!ocupado) return null
  return (
    <div
      className={`carregando${mostrarIndicador ? ' carregando--visivel' : ''}`}
      data-testid="bloqueio-toques"
      onPointerDown={(evento) => evento.preventDefault()}
    >
      {mostrarIndicador && <div className="carregando-spinner" role="progressbar" aria-label={Mensagens.geral.carregando} />}
    </div>
  )
}
