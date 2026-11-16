import { describe, expect, it } from 'vitest'
import {
  avisoIosFoiDispensado,
  decidirOferta,
  dispensarAvisoIos,
  ehIos,
  ehSafariIos,
  estaInstalado,
  type AmbienteNavegador,
} from './plataforma'

const ua = {
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  firefoxIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  safariIpadOs:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
}

function ambiente(parcial: Partial<AmbienteNavegador>): AmbienteNavegador {
  return { userAgent: ua.chromeAndroid, maxTouchPoints: 5, displayModeStandalone: false, ...parcial }
}

describe('detecção de plataforma', () => {
  it('reconhece o Safari do iPhone', () => {
    expect(ehSafariIos({ userAgent: ua.safariIphone, maxTouchPoints: 5 })).toBe(true)
  })

  it('reconhece o iPad com iPadOS, que se apresenta como Mac', () => {
    expect(ehIos({ userAgent: ua.safariIpadOs, maxTouchPoints: 5 })).toBe(true)
    expect(ehSafariIos({ userAgent: ua.safariIpadOs, maxTouchPoints: 5 })).toBe(true)
  })

  it('não confunde o Safari do Mac com iOS', () => {
    expect(ehIos({ userAgent: ua.safariMac, maxTouchPoints: 0 })).toBe(false)
  })

  it.each([ua.chromeIphone, ua.firefoxIphone])('outros navegadores do iPhone não são o Safari', (userAgent) => {
    expect(ehIos({ userAgent, maxTouchPoints: 5 })).toBe(true)
    expect(ehSafariIos({ userAgent, maxTouchPoints: 5 })).toBe(false)
  })

  it('Chrome do Android não é iOS', () => {
    expect(ehIos({ userAgent: ua.chromeAndroid, maxTouchPoints: 5 })).toBe(false)
  })
})

describe('modo standalone', () => {
  it('app aberto pelo ícone no iPhone (navigator.standalone)', () => {
    expect(estaInstalado({ standaloneIos: true, displayModeStandalone: false })).toBe(true)
  })

  it('app aberto pelo ícone no Android (display-mode: standalone)', () => {
    expect(estaInstalado({ standaloneIos: undefined, displayModeStandalone: true })).toBe(true)
  })

  it('aberto no navegador', () => {
    expect(estaInstalado({ standaloneIos: false, displayModeStandalone: false })).toBe(false)
  })
})

describe('decidirOferta', () => {
  it('Android com o navegador permitindo instalar → "Instalar app"', () => {
    expect(
      decidirOferta({ ambiente: ambiente({}), podeInstalarPeloNavegador: true, avisoIosDispensado: false }),
    ).toBe('android')
  })

  it('Android sem o evento de instalação → nada', () => {
    expect(
      decidirOferta({ ambiente: ambiente({}), podeInstalarPeloNavegador: false, avisoIosDispensado: false }),
    ).toBeNull()
  })

  it('Safari do iPhone fora da tela inicial → aviso', () => {
    expect(
      decidirOferta({
        ambiente: ambiente({ userAgent: ua.safariIphone, standaloneIos: false }),
        podeInstalarPeloNavegador: false,
        avisoIosDispensado: false,
      }),
    ).toBe('ios')
  })

  it('aviso dispensado com "Agora não" não volta', () => {
    expect(
      decidirOferta({
        ambiente: ambiente({ userAgent: ua.safariIphone, standaloneIos: false }),
        podeInstalarPeloNavegador: false,
        avisoIosDispensado: true,
      }),
    ).toBeNull()
  })

  it('Chrome do iPhone não mostra o aviso do Safari', () => {
    expect(
      decidirOferta({
        ambiente: ambiente({ userAgent: ua.chromeIphone }),
        podeInstalarPeloNavegador: false,
        avisoIosDispensado: false,
      }),
    ).toBeNull()
  })

  it('app já instalado no iPhone → nenhuma oferta', () => {
    expect(
      decidirOferta({
        ambiente: ambiente({ userAgent: ua.safariIphone, standaloneIos: true }),
        podeInstalarPeloNavegador: false,
        avisoIosDispensado: false,
      }),
    ).toBeNull()
  })

  it('app já instalado no Android → nenhuma oferta, mesmo com o evento', () => {
    expect(
      decidirOferta({
        ambiente: ambiente({ displayModeStandalone: true }),
        podeInstalarPeloNavegador: true,
        avisoIosDispensado: false,
      }),
    ).toBeNull()
  })
})

describe('dispensa do aviso do iPhone', () => {
  it('fica lembrada no localStorage', () => {
    expect(avisoIosFoiDispensado(localStorage)).toBe(false)
    dispensarAvisoIos(localStorage)
    expect(avisoIosFoiDispensado(localStorage)).toBe(true)
  })

  it('localStorage indisponível não quebra', () => {
    const quebrado = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    expect(() => dispensarAvisoIos(quebrado)).not.toThrow()
    expect(avisoIosFoiDispensado(quebrado)).toBe(false)
  })
})
