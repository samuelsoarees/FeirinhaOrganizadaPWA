import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog } from '../componentes/Dialog'
import { ProvedorCamadas } from './ProvedorCamadas'
import { PilhaCamadas } from './PilhaCamadas'

function DoisDialogs() {
  const [baixo, setBaixo] = useState(true)
  const [topo, setTopo] = useState(true)
  return (
    <>
      <Dialog
        aberto={baixo}
        opcoes={{ icone: 'alerta', titulo: 'Camada de baixo', mensagem: 'baixo', textoConfirmar: 'Confirmar', textoCancelar: 'Cancelar' }}
        aoFechar={() => setBaixo(false)}
      />
      <Dialog
        aberto={topo}
        opcoes={{ icone: 'info', titulo: 'Camada do topo', mensagem: 'topo' }}
        aoFechar={() => setTopo(false)}
      />
    </>
  )
}

function voltarDoAndroid() {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pilha de camadas ligada ao history', () => {
  it('o voltar (popstate) fecha só a camada do topo', () => {
    render(
      <ProvedorCamadas>
        <DoisDialogs />
      </ProvedorCamadas>,
    )
    expect(screen.getByText('Camada de baixo')).toBeInTheDocument()
    expect(screen.getByText('Camada do topo')).toBeInTheDocument()

    voltarDoAndroid()
    expect(screen.queryByText('Camada do topo')).not.toBeInTheDocument()
    expect(screen.getByText('Camada de baixo')).toBeInTheDocument()

    voltarDoAndroid()
    expect(screen.queryByText('Camada de baixo')).not.toBeInTheDocument()
  })

  it('cada camada aberta empilha uma entrada no history', () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    render(
      <ProvedorCamadas>
        <DoisDialogs />
      </ProvedorCamadas>,
    )
    expect(pushState).toHaveBeenCalledTimes(2)
  })

  it('fechar pelo botão volta o history e o popstate resultante não fecha outra camada', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    render(
      <ProvedorCamadas>
        <DoisDialogs />
      </ProvedorCamadas>,
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    })
    expect(screen.queryByText('Camada do topo')).not.toBeInTheDocument()
    expect(back).toHaveBeenCalledTimes(1)

    // popstate gerado pelo history.back() acima
    voltarDoAndroid()
    expect(screen.getByText('Camada de baixo')).toBeInTheDocument()

    // agora sim, um voltar do usuário fecha a camada de baixo
    voltarDoAndroid()
    expect(screen.queryByText('Camada de baixo')).not.toBeInTheDocument()
  })

  it('o voltar num dialog com "Cancelar" equivale a cancelar', () => {
    const aoFechar = vi.fn()
    render(
      <ProvedorCamadas>
        <Dialog
          aberto
          opcoes={{ icone: 'alerta', titulo: 'Excluir?', mensagem: 'm', textoConfirmar: 'Excluir', textoCancelar: 'Cancelar' }}
          aoFechar={aoFechar}
        />
      </ProvedorCamadas>,
    )
    voltarDoAndroid()
    expect(aoFechar).toHaveBeenCalledWith(false)
  })
})

describe('PilhaCamadas trocando de camada no mesmo toque', () => {
  it('fechar o menu e abrir o modal reaproveita a entrada do history', async () => {
    const pilha = new PilhaCamadas(window)
    const desinstalar = pilha.instalar()
    const menu = pilha.abrir(vi.fn())
    const pushState = vi.spyOn(window.history, 'pushState')
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})

    pilha.fechar(menu)
    const aoVoltarModal = vi.fn()
    pilha.abrir(aoVoltarModal)
    await Promise.resolve()

    expect(back).not.toHaveBeenCalled()
    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).toHaveBeenCalledTimes(1)

    // O voltar do Android fecha o modal, que agora é o topo.
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(aoVoltarModal).toHaveBeenCalledTimes(1)
    expect(pilha.quantidade).toBe(0)
    desinstalar()
  })

  it('fechar duas camadas no mesmo toque volta as duas entradas de uma vez', async () => {
    const pilha = new PilhaCamadas(window)
    const desinstalar = pilha.instalar()
    const a = pilha.abrir(vi.fn())
    const b = pilha.abrir(vi.fn())
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})

    pilha.fechar(b)
    pilha.fechar(a)
    await Promise.resolve()

    expect(go).toHaveBeenCalledWith(-2)
    desinstalar()
  })
})

describe('PilhaCamadas bloqueada', () => {
  it('com operação em andamento, o voltar é desfeito e nada fecha', () => {
    const pilha = new PilhaCamadas(window)
    const desinstalar = pilha.instalar()
    const aoVoltar = vi.fn()
    pilha.abrir(aoVoltar)
    pilha.definirBloqueio(true)
    const pushState = vi.spyOn(window.history, 'pushState')

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(aoVoltar).not.toHaveBeenCalled()
    expect(pushState).toHaveBeenCalledTimes(1)
    expect(pilha.quantidade).toBe(1)

    pilha.definirBloqueio(false)
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(aoVoltar).toHaveBeenCalledTimes(1)
    expect(pilha.quantidade).toBe(0)
    desinstalar()
  })
})
