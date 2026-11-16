import { Mensagens } from '../dominio/mensagens'
import './AvisoInstalacaoIos.css'

export function AvisoInstalacaoIos({ aoDispensar }: { aoDispensar: () => void }) {
  return (
    <section className="aviso-ios" aria-labelledby="aviso-ios-titulo">
      <div className="aviso-ios-icone" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="M8 7l4-4 4 4" />
          <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
        </svg>
      </div>
      <div className="aviso-ios-texto">
        <h2 id="aviso-ios-titulo">{Mensagens.instalacao.iosTitulo}</h2>
        <p>{Mensagens.instalacao.iosTexto}</p>
        <button type="button" className="aviso-ios-dispensar" onClick={aoDispensar}>
          {Mensagens.instalacao.agoraNao}
        </button>
      </div>
    </section>
  )
}
