// Detecção de plataforma e de modo standalone, em funções puras para teste.

export type AmbienteNavegador = {
  userAgent: string
  maxTouchPoints: number
  // navigator.standalone (só existe no Safari iOS)
  standaloneIos?: boolean
  // matchMedia('(display-mode: standalone)').matches
  displayModeStandalone: boolean
}

export function ehIos({ userAgent, maxTouchPoints }: Pick<AmbienteNavegador, 'userAgent' | 'maxTouchPoints'>): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true
  // iPadOS se apresenta como Mac, mas tem tela de toque.
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1
}

export function ehSafariIos(ambiente: Pick<AmbienteNavegador, 'userAgent' | 'maxTouchPoints'>): boolean {
  if (!ehIos(ambiente)) return false
  const { userAgent } = ambiente
  if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|GSA\/|DuckDuckGo|FBAN|FBAV|Instagram|Line\//.test(userAgent)) {
    return false
  }
  return /Safari\//.test(userAgent)
}

export function estaInstalado(ambiente: Pick<AmbienteNavegador, 'standaloneIos' | 'displayModeStandalone'>): boolean {
  return ambiente.standaloneIos === true || ambiente.displayModeStandalone
}

export type OfertaInstalacao = 'android' | 'ios' | null

export function decidirOferta(params: {
  ambiente: AmbienteNavegador
  podeInstalarPeloNavegador: boolean
  avisoIosDispensado: boolean
}): OfertaInstalacao {
  const { ambiente, podeInstalarPeloNavegador, avisoIosDispensado } = params
  if (estaInstalado(ambiente)) return null
  if (podeInstalarPeloNavegador) return 'android'
  if (ehSafariIos(ambiente) && !avisoIosDispensado) return 'ios'
  return null
}

export function lerAmbiente(janela: Window = window): AmbienteNavegador {
  const navegador = janela.navigator as Navigator & { standalone?: boolean }
  return {
    userAgent: navegador.userAgent,
    maxTouchPoints: navegador.maxTouchPoints ?? 0,
    standaloneIos: navegador.standalone,
    displayModeStandalone: janela.matchMedia?.('(display-mode: standalone)').matches ?? false,
  }
}

const chaveAvisoIos = 'feira.avisoInstalacaoIosDispensado'

export function avisoIosFoiDispensado(armazenamento: Pick<Storage, 'getItem'>): boolean {
  try {
    return armazenamento.getItem(chaveAvisoIos) === '1'
  } catch {
    return false
  }
}

export function dispensarAvisoIos(armazenamento: Pick<Storage, 'setItem'>): void {
  try {
    armazenamento.setItem(chaveAvisoIos, '1')
  } catch {
    // Sem localStorage (modo privado), o aviso volta na próxima abertura.
  }
}
