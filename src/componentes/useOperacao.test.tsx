import { act, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroArmazenamento, ErroNaoEncontrado, ErroValidacao } from '../dominio/erros'
import { ProvedorCamadas } from '../navegacao/ProvedorCamadas'
import { PilhaCamadas } from '../navegacao/PilhaCamadas'
import { ProvedorDialog } from './ProvedorDialog'
import { useOperacao } from './useOperacao'

let pilha: PilhaCamadas

function Provedores({ children }: { children: ReactNode }) {
  return (
    <ProvedorCamadas pilha={pilha}>
      <ProvedorDialog>{children}</ProvedorDialog>
    </ProvedorCamadas>
  )
}

function promessaControlada<T = void>() {
  let resolver!: (valor: T) => void
  let rejeitar!: (erro: unknown) => void
  const promessa = new Promise<T>((ok, falha) => {
    resolver = ok
    rejeitar = falha
  })
  return { promessa, resolver, rejeitar }
}

const opcoes = { mensagemFalha: 'Não foi possível salvar a lista. Tente novamente.' }

beforeEach(() => {
  vi.useFakeTimers()
  pilha = new PilhaCamadas(window)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useOperacao', () => {
  it('bloqueia desde o início e não mostra o indicador antes de 300 ms', async () => {
    const { result } = renderHook(() => useOperacao(), { wrapper: Provedores })
    const operacao = promessaControlada()

    let resultado!: Promise<unknown>
    act(() => {
      resultado = result.current.executar(() => operacao.promessa, opcoes)
    })
    expect(result.current.ocupado).toBe(true)

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current.mostrarIndicador).toBe(false)

    await act(async () => {
      operacao.resolver()
      await resultado
    })
    expect(result.current.ocupado).toBe(false)
    expect(result.current.mostrarIndicador).toBe(false)
  })

  it('mostra o indicador a partir de 300 ms e esconde ao terminar', async () => {
    const { result } = renderHook(() => useOperacao(), { wrapper: Provedores })
    const operacao = promessaControlada()

    let resultado!: Promise<unknown>
    act(() => {
      resultado = result.current.executar(() => operacao.promessa, opcoes)
    })
    act(() => {
      vi.advanceTimersByTime(301)
    })
    expect(result.current.mostrarIndicador).toBe(true)

    await act(async () => {
      operacao.resolver()
      await resultado
    })
    expect(result.current.mostrarIndicador).toBe(false)
  })

  it('duas chamadas seguidas executam uma vez só', async () => {
    const { result } = renderHook(() => useOperacao(), { wrapper: Provedores })
    const acao = vi.fn(() => Promise.resolve(1))

    let primeira!: Promise<unknown>
    let segunda!: Promise<unknown>
    act(() => {
      primeira = result.current.executar(acao, opcoes)
      segunda = result.current.executar(acao, opcoes)
    })
    await act(async () => {
      expect(await primeira).toEqual({ status: 'ok', valor: 1 })
      expect(await segunda).toEqual({ status: 'ignorada' })
    })
    expect(acao).toHaveBeenCalledTimes(1)
  })

  it('bloqueia o voltar durante a operação', async () => {
    const definirBloqueio = vi.spyOn(pilha, 'definirBloqueio')
    const { result } = renderHook(() => useOperacao(), { wrapper: Provedores })
    await act(async () => {
      await result.current.executar(() => Promise.resolve(), opcoes)
    })
    expect(definirBloqueio.mock.calls).toEqual([[true], [false]])
  })

  it('erro de validação → "Atenção" com a mensagem da regra', async () => {
    const { result } = renderHook(() => useOperacao(), { wrapper: Provedores })
    await act(async () => {
      const r = await result.current.executar(() => Promise.reject(new ErroValidacao('Informe o nome da lista.')), opcoes)
      expect(r.status).toBe('erro')
    })
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Atenção')
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Informe o nome da lista.')
  })

  it('lista não encontrada → "Atenção"', async () => {
    const { result } = renderHook(() => useOperacao(), { wrapper: Provedores })
    await act(async () => {
      await result.current.executar(() => Promise.reject(new ErroNaoEncontrado('Esta lista não existe mais.')), opcoes)
    })
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Atenção')
  })

  it('falha técnica → "Ops!" com a mensagem genérica, sem o texto técnico', async () => {
    const { result } = renderHook(() => useOperacao(), { wrapper: Provedores })
    await act(async () => {
      await result.current.executar(
        () => Promise.reject(new ErroArmazenamento('salvar', new Error('database is locked'))),
        opcoes,
      )
    })
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('Ops!')
    expect(dialog).toHaveTextContent('Não foi possível salvar a lista. Tente novamente.')
    expect(dialog).not.toHaveTextContent('database is locked')
  })
})
