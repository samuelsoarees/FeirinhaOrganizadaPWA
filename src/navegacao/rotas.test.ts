import { describe, expect, it } from 'vitest'
import { hashDaRota, interpretarHash } from './rotas'

describe('interpretarHash', () => {
  it.each(['', '#', '#/', '#/qualquer', '#/lista/', '#/lista/abc'])('"%s" abre Listas', (hash) => {
    expect(interpretarHash(hash)).toEqual({ tela: 'listas' })
  })

  it('#/lista/1 abre o detalhe da lista 1', () => {
    expect(interpretarHash('#/lista/1')).toEqual({ tela: 'detalhe', idLista: '1' })
  })

  it('aceita a barra no fim', () => {
    expect(interpretarHash('#/lista/42/')).toEqual({ tela: 'detalhe', idLista: '42' })
  })
})

describe('hashDaRota', () => {
  it('monta o hash de cada tela', () => {
    expect(hashDaRota({ tela: 'listas' })).toBe('#/')
    expect(hashDaRota({ tela: 'detalhe', idLista: '7' })).toBe('#/lista/7')
  })
})
