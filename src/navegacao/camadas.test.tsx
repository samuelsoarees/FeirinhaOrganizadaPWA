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

  it('fechar pelo botão volta o history e o popstate resultante não fecha outra camada', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    render(
      <ProvedorCamadas>
        <DoisDialogs />
      </ProvedorCamadas>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
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
