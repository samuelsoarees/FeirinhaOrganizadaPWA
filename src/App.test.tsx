import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { bancoPadrao } from './dados/repositorios'

afterEach(async () => {
  window.location.hash = ''
  const banco = bancoPadrao()
  await banco.transaction('rw', banco.listas, banco.itens, async () => {
    await banco.listas.clear()
    await banco.itens.clear()
  })
})

describe('App', () => {
  it('abre "Minhas Listas" com o estado vazio', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Minhas Listas' })).toBeInTheDocument()
    expect(await screen.findByText('Você ainda não tem listas')).toBeInTheDocument()
    expect(screen.getByText('nenhuma lista')).toBeInTheDocument()
    expect(
      screen.getByText('Crie uma lista para lançar os itens da feira e ver o total da compra.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/^versão /)).toBeInTheDocument()
  })

  it('cria a primeira lista no banco do app e ela continua lá ao reabrir', async () => {
    const { unmount } = render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    fireEvent.change(screen.getByLabelText('Nome da lista'), { target: { value: 'Feira do sábado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Feira do sábado')).toBeInTheDocument()
    unmount()

    render(<App />)
    expect(await screen.findByText('Feira do sábado')).toBeInTheDocument()
    expect(screen.getByText('1 lista')).toBeInTheDocument()
  })

  it('abre a tela provisória pelo endereço #/lista/1', () => {
    window.location.hash = '#/lista/1'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Lista 1' })).toBeInTheDocument()
  })

  it('o "‹" volta para Listas', () => {
    window.location.hash = '#/lista/1'
    render(<App />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { name: 'Minhas Listas' })).toBeInTheDocument()
  })
})
