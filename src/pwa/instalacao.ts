import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { avisoIosFoiDispensado, decidirOferta, dispensarAvisoIos, lerAmbiente, type OfertaInstalacao } from './plataforma'

type EventoInstalacao = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// O beforeinstallprompt pode chegar antes do React montar, então é capturado no carregamento do módulo.
let eventoGuardado: EventoInstalacao | null = null
const ouvintes = new Set<() => void>()

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte())
}

export function capturarEventosInstalacao(janela: Window = window): void {
  janela.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault()
    eventoGuardado = evento as EventoInstalacao
    avisar()
  })
  janela.addEventListener('appinstalled', () => {
    eventoGuardado = null
    avisar()
  })
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

function lerEvento() {
  return eventoGuardado
}

export function useOfertaInstalacao(): {
  oferta: OfertaInstalacao
  instalar: () => Promise<void>
  dispensarIos: () => void
} {
  const evento = useSyncExternalStore(assinar, lerEvento, () => null)
  const [iosDispensado, setIosDispensado] = useState(() => avisoIosFoiDispensado(localStorage))
  const [instaladoAgora, setInstaladoAgora] = useState(false)

  useEffect(() => {
    const consulta = window.matchMedia?.('(display-mode: standalone)')
    if (!consulta) return
    const aoMudar = () => setInstaladoAgora(consulta.matches)
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  const oferta = instaladoAgora
    ? null
    : decidirOferta({
        ambiente: lerAmbiente(),
        podeInstalarPeloNavegador: evento !== null,
        avisoIosDispensado: iosDispensado,
      })

  const instalar = useCallback(async () => {
    if (!eventoGuardado) return
    const atual = eventoGuardado
    await atual.prompt()
    const escolha = await atual.userChoice
    if (escolha.outcome === 'accepted') {
      eventoGuardado = null
      avisar()
    }
  }, [])

  const dispensarIos = useCallback(() => {
    dispensarAvisoIos(localStorage)
    setIosDispensado(true)
  }, [])

  return { oferta, instalar, dispensarIos }
}
