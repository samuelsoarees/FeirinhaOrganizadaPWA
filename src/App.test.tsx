import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App'

afterEach(() => {
  window.location.hash = ''
})

describe('App', () => {
  it('abre "Minhas Listas" com o estado vazio', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Minhas Listas' })).toBeInTheDocument()
    expect(screen.getByText('nenhuma lista')).toBeInTheDocument()
    expect(screen.getByText('Você ainda não tem listas')).toBeInTheDocument()
    expect(
      screen.getByText('Crie uma lista para lançar os itens da feira e ver o total da compra.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/^versão /)).toBeInTheDocument()
  })

  it('"Criar minha primeira lista" mostra "Em breve"', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Criar minha primeira lista' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Em breve')
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
