import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { RegistroLista } from './dados/banco'
import { bancoPadrao, repositoriosPadrao } from './dados/repositorios'
import type { Item } from './dominio/itens'

afterEach(async () => {
  vi.restoreAllMocks()
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

  it('o card abre o detalhe e o "‹" volta para Listas sem empilhar outra entrada', async () => {
    const banco = bancoPadrao()
    const id = await banco.listas.add({ nome: 'Feira do sábado', dataCriacao: new Date().toISOString() } as RegistroLista)
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /^Feira do sábado/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Feira do sábado' })).toBeInTheDocument()
    expect(window.location.hash).toBe(`#/lista/${id}`)
    expect(await screen.findByText('Nenhum item ainda. Toque em + para adicionar.')).toBeInTheDocument()

    const tamanho = window.history.length
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByRole('heading', { name: 'Minhas Listas' })).toBeInTheDocument()
    expect(window.location.hash).toBe('')
    expect(window.history.length).toBe(tamanho)
  })

  it('pelo endereço de uma lista excluída avisa e mostra Listas ao fechar', async () => {
    window.location.hash = '#/lista/999'
    render(<App />)
    await waitFor(() => expect(screen.getByRole('alertdialog')).toHaveTextContent('Esta lista não existe mais.'))
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(await screen.findByRole('heading', { name: 'Minhas Listas' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/')
  })

  it('com a leitura em andamento, o voltar não sai do detalhe', async () => {
    const banco = bancoPadrao()
    const id = await banco.listas.add({ nome: 'Feira do sábado', dataCriacao: new Date().toISOString() } as RegistroLista)
    window.location.hash = '#/'
    render(<App />)
    let terminarLeitura: (itens: Item[]) => void = () => {}
    vi.spyOn(repositoriosPadrao().itens, 'listar').mockImplementation(
      () => new Promise<Item[]>((resolver) => (terminarLeitura = resolver)),
    )
    fireEvent.click(await screen.findByRole('button', { name: /^Feira do sábado/ }))
    expect(await screen.findByTestId('bloqueio-toques')).toBeInTheDocument()

    // Voltar do Android com nada aberto, durante a leitura.
    await act(async () => {
      const mudouHash = new Promise((resolver) => window.addEventListener('hashchange', resolver, { once: true }))
      window.history.back()
      await mudouHash
    })
    expect(window.location.hash).toBe(`#/lista/${id}`)
    expect(screen.queryByRole('heading', { name: 'Minhas Listas' })).not.toBeInTheDocument()

    act(() => terminarLeitura([]))
    expect(await screen.findByText('Nenhum item ainda. Toque em + para adicionar.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Feira do sábado' })).toBeInTheDocument()

    // Depois da leitura, o "‹" volta para Listas normalmente.
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByRole('heading', { name: 'Minhas Listas' })).toBeInTheDocument()
  })
})
