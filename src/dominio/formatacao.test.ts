import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatarData, formatarReais } from './formatacao'
import { Mensagens } from './mensagens'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatarReais', () => {
  it.each([
    [0, 'R$ 0,00'],
    [5, 'R$ 0,05'],
    [3740, 'R$ 37,40'],
    [100000, 'R$ 1.000,00'],
    [1234567, 'R$ 12.345,67'],
    [999999999, 'R$ 9.999.999,99'],
  ])('%i centavos → "%s"', (centavos, esperado) => {
    expect(formatarReais(centavos)).toBe(esperado)
  })

  it('com o aparelho em inglês continua em pt-BR', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
    expect(formatarReais(3740)).toBe('R$ 37,40')
    expect(formatarReais(1234567)).toBe('R$ 12.345,67')
  })
})

describe('formatarData', () => {
  it('usa dd/mm/aaaa', () => {
    expect(formatarData(new Date(2026, 9, 30, 9, 0))).toBe('30/10/2026')
    expect(formatarData(new Date(2026, 0, 5, 23, 59))).toBe('05/01/2026')
  })
})

describe('textos da tela de Listas', () => {
  it('resumo de itens', () => {
    expect(Mensagens.listas.resumoItens(0, 0)).toBe('nenhum item')
    expect(Mensagens.listas.resumoItens(0, 1)).toBe('0 de 1 item')
    expect(Mensagens.listas.resumoItens(1, 1)).toBe('1 de 1 item')
    expect(Mensagens.listas.resumoItens(4, 6)).toBe('4 de 6 itens')
  })

  it('subtítulo', () => {
    expect(Mensagens.listas.subtitulo(0)).toBe('nenhuma lista')
    expect(Mensagens.listas.subtitulo(1)).toBe('1 lista')
    expect(Mensagens.listas.subtitulo(4)).toBe('4 listas')
  })

  it('mensagem de exclusão nas três variações', () => {
    expect(Mensagens.listas.excluirMensagem('Churrasco domingo', 7)).toBe(
      '“Churrasco domingo” e seus 7 itens serão excluídos. Essa ação não pode ser desfeita.',
    )
    expect(Mensagens.listas.excluirMensagem('Frutas', 1)).toBe(
      '“Frutas” e seu 1 item serão excluídos. Essa ação não pode ser desfeita.',
    )
    expect(Mensagens.listas.excluirMensagem('Feira 14/10', 0)).toBe(
      '“Feira 14/10” será excluída. Essa ação não pode ser desfeita.',
    )
  })
})
