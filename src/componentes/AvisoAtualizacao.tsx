import { useRegisterSW } from 'virtual:pwa-register/react'
import { Mensagens } from '../dominio/mensagens'
import './AvisoAtualizacao.css'

// Com registerType 'prompt', o service worker novo fica esperando até o usuário tocar em "Atualizar".
// Verifica se há versão nova a cada hora com o app aberto.
const intervaloVerificacao = 60 * 60 * 1000

export function AvisoAtualizacao() {
  const {
    needRefresh: [precisaAtualizar],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      setInterval(() => {
        if (navigator.onLine) registro.update().catch(() => {})
      }, intervaloVerificacao)
    },
  })

  if (!precisaAtualizar) return null

  return (
    <div className="aviso-atualizacao" role="status">
      <span>{Mensagens.atualizacao.novaVersao}</span>
      <button type="button" className="aviso-atualizacao-botao" onClick={() => updateServiceWorker(true)}>
        {Mensagens.atualizacao.atualizar}
      </button>
    </div>
  )
}
