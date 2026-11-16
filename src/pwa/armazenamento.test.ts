import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pedirArmazenamentoPersistente, reiniciarPedidoArmazenamento } from './armazenamento'

function armazenamentoFalso(opcoes: { persisted?: boolean; persist?: () => Promise<boolean> }) {
  return {
    persisted: vi.fn(() => Promise.resolve(opcoes.persisted ?? false)),
    persist: vi.fn(opcoes.persist ?? (() => Promise.resolve(true))),
  } as unknown as StorageManager & { persist: ReturnType<typeof vi.fn>; persisted: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  reiniciarPedidoArmazenamento()
})

describe('pedirArmazenamentoPersistente', () => {
  it('pede o armazenamento persistente', async () => {
    const armazenamento = armazenamentoFalso({})
    await pedirArmazenamentoPersistente(armazenamento)
    expect(armazenamento.persist).toHaveBeenCalledTimes(1)
  })

  it('não pede de novo se já é persistente', async () => {
    const armazenamento = armazenamentoFalso({ persisted: true })
    await pedirArmazenamentoPersistente(armazenamento)
    expect(armazenamento.persist).not.toHaveBeenCalled()
  })

  it('pede uma vez só por sessão', async () => {
    const armazenamento = armazenamentoFalso({})
    await pedirArmazenamentoPersistente(armazenamento)
    await pedirArmazenamentoPersistente(armazenamento)
    expect(armazenamento.persist).toHaveBeenCalledTimes(1)
  })

  it('navegador que nega ou falha não gera erro', async () => {
    await expect(pedirArmazenamentoPersistente(armazenamentoFalso({ persist: () => Promise.resolve(false) }))).resolves.toBeUndefined()
    reiniciarPedidoArmazenamento()
    await expect(
      pedirArmazenamentoPersistente(armazenamentoFalso({ persist: () => Promise.reject(new Error('negado')) })),
    ).resolves.toBeUndefined()
  })

  it('navegador sem a API não gera erro', async () => {
    await expect(pedirArmazenamentoPersistente(undefined)).resolves.toBeUndefined()
  })
})
