import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { ProvedorDialog } from '../componentes/ProvedorDialog'
import { ProvedorRepositorios } from '../componentes/ProvedorRepositorios'
import type { BancoFeira } from '../dados/banco'
import type { Repositorios } from '../dados/repositorios'
import { ErroArmazenamento } from '../dominio/erros'
import { nomeSugerido } from '../dominio/listas'
import { ProvedorCamadas } from '../navegacao/ProvedorCamadas'
import { reiniciarPedidoArmazenamento } from '../pwa/armazenamento'
import { criarBancoDeTeste, inserirItens } from '../testes/bancoDeTeste'
import { TelaListas } from './TelaListas'

let banco: BancoFeira
let repositorios: Repositorios

beforeEach(() => {
  const criado = criarBancoDeTeste()
  banco = criado.banco
  repositorios = criado.repositorios
})

afterEach(async () => {
  window.location.hash = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
  await banco.delete()
})

function renderizar() {
  return render(
    <ProvedorCamadas>
      <ProvedorDialog>
        <ProvedorRepositorios repositorios={repositorios}>
          <TelaListas />
        </ProvedorRepositorios>
      </ProvedorDialog>
    </ProvedorCamadas>,
  )
}

async function criarLista(nome: string, data: Date, itens: { quantidade: number; valorUnitarioCentavos: number; concluido: boolean }[] = []) {
  const id = await repositorios.listas.inserir(nome, data)
  if (itens.length) await inserirItens(banco, id, itens)
  return id
}

const itensSemPreco = (quantidade: number) =>
  Array.from({ length: quantidade }, () => ({ quantidade: 1, valorUnitarioCentavos: 0, concluido: false }))

function dialog() {
  return screen.getByRole('alertdialog')
}

function fecharDialog(nomeBotao = 'OK') {
  fireEvent.click(within(dialog()).getByRole('button', { name: nomeBotao }))
}

function campoNome(): HTMLInputElement {
  return screen.getByLabelText('Nome da lista')
}

function card(nome: string): HTMLElement {
  return screen.getByText(nome).closest('li')!
}

function abrirMenuPeloBotao(nome: string) {
  fireEvent.click(screen.getByRole('button', { name: `Opções de ${nome}` }))
}

function voltarDoAndroid() {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

describe('estados da tela', () => {
  it('sem listas mostra o estado vazio, "nenhuma lista" e esconde o "+"', async () => {
    renderizar()
    expect(await screen.findByText('Você ainda não tem listas')).toBeInTheDocument()
    expect(screen.getByText('nenhuma lista')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar minha primeira lista' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nova lista' })).not.toBeInTheDocument()
  })

  it('com listas mostra os cards na ordem, o subtítulo e o "+"', async () => {
    await criarLista('Feira 14/10', new Date(2026, 9, 14, 9))
    await criarLista('Feira do sábado', new Date(2026, 9, 30, 9), [
      { quantidade: 2, valorUnitarioCentavos: 850, concluido: true },
      { quantidade: 1, valorUnitarioCentavos: 1200, concluido: true },
      { quantidade: 3, valorUnitarioCentavos: 180, concluido: true },
      { quantidade: 1, valorUnitarioCentavos: 300, concluido: true },
      { quantidade: 2, valorUnitarioCentavos: 500, concluido: false },
      { quantidade: 1, valorUnitarioCentavos: 400, concluido: false },
    ])
    await criarLista('Churrasco', new Date(2026, 9, 28, 9), [{ quantidade: 1, valorUnitarioCentavos: 1234567, concluido: true }])

    renderizar()
    await screen.findByText('Feira do sábado')

    expect(screen.getByText('3 listas')).toBeInTheDocument()
    const nomes = screen.getAllByRole('listitem').map((li) => li.querySelector('.card-nome')?.textContent)
    expect(nomes).toEqual(['Feira do sábado', 'Churrasco', 'Feira 14/10'])

    const sabado = card('Feira do sábado')
    expect(sabado).toHaveTextContent('30/10/2026 · 4 de 6 itens')
    expect(sabado).toHaveTextContent('R$ 37,40')
    expect(sabado).toHaveTextContent('concluído')
    expect(card('Churrasco')).toHaveTextContent('R$ 12.345,67')
    expect(card('Feira 14/10')).toHaveTextContent('14/10/2026 · nenhum item')
    expect(card('Feira 14/10')).toHaveTextContent('R$ 0,00')
    expect(screen.getByRole('button', { name: 'Nova lista' })).toBeInTheDocument()
  })

  it('a faixa do card é a cor do toldo da própria lista', async () => {
    const id = await criarLista('Feira do sábado', new Date())
    renderizar()
    await screen.findByText('Feira do sábado')
    const cores = ['#4BBBBD', '#FDCB6E', '#C2BE55', '#E9775F']
    expect(card('Feira do sábado').style.getPropertyValue('--faixa')).toBe(cores[id % 4])
  })

  it('falha ao carregar mostra "Ops!" e o estado de erro; "Tentar novamente" recarrega', async () => {
    await criarLista('Feira do sábado', new Date())
    const listar = vi
      .spyOn(repositorios.listas, 'listar')
      .mockRejectedValueOnce(new ErroArmazenamento('listar', new Error('database disk image is malformed')))

    renderizar()
    await waitFor(() => expect(dialog()).toHaveTextContent('Ops!'))
    expect(dialog()).toHaveTextContent('Não foi possível carregar suas listas. Tente novamente.')
    expect(dialog()).not.toHaveTextContent('malformed')
    expect(screen.getByText('Não foi possível carregar suas listas.')).toBeInTheDocument()
    expect(screen.queryByText('nenhuma lista')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nova lista' })).not.toBeInTheDocument()

    fecharDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Feira do sábado')).toBeInTheDocument()
    expect(screen.getByText('1 lista')).toBeInTheDocument()
    expect(listar).toHaveBeenCalledTimes(2)
  })
})

describe('criar lista', () => {
  it('o "+" abre "Nova lista" com o nome sugerido selecionado; Salvar cria e põe no topo', async () => {
    await criarLista('Antiga', new Date(2026, 0, 1))
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Nova lista' }))

    expect(screen.getByRole('dialog', { name: 'Nova lista' })).toBeInTheDocument()
    const campo = campoNome()
    const sugerido = nomeSugerido(new Date())
    expect(campo).toHaveValue(sugerido)
    expect(campo).toHaveFocus()
    expect([campo.selectionStart, campo.selectionEnd]).toEqual([0, sugerido.length])
    expect(campo).toHaveAttribute('maxLength', '60')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.getByText('2 listas')).toBeInTheDocument())
    expect(screen.queryByRole('dialog', { name: 'Nova lista' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(sugerido)
  })

  it('Enter no campo grava', async () => {
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    fireEvent.change(campoNome(), { target: { value: 'Churrasco' } })
    fireEvent.submit(campoNome())
    expect(await screen.findByText('Churrasco')).toBeInTheDocument()
  })

  it('Cancelar fecha sem gravar e tocar fora não fecha', async () => {
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    fireEvent.change(campoNome(), { target: { value: 'Churrasco' } })

    fireEvent.click(document.querySelector('.modal-overlay')!)
    expect(campoNome()).toHaveValue('Churrasco')

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Nova lista' })).not.toBeInTheDocument()
    expect(await banco.listas.count()).toBe(0)
  })

  it('nome inválido mostra "Atenção" e o modal continua aberto com o texto', async () => {
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    fireEvent.change(campoNome(), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(dialog()).toHaveTextContent('Atenção'))
    expect(dialog()).toHaveTextContent('Informe o nome da lista.')
    fecharDialog()
    expect(screen.getByRole('dialog', { name: 'Nova lista' })).toBeInTheDocument()
    expect(campoNome()).toHaveValue('   ')
    expect(await banco.listas.count()).toBe(0)
  })

  it('toque duplo em Salvar cria uma lista só', async () => {
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    const salvar = screen.getByRole('button', { name: 'Salvar' })
    fireEvent.click(salvar)
    fireEvent.click(salvar)
    await waitFor(() => expect(screen.getByText('1 lista')).toBeInTheDocument())
    expect(await banco.listas.count()).toBe(1)
  })

  it('falha ao salvar mostra "Ops!" e o modal continua aberto com o nome', async () => {
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    vi.spyOn(banco.listas, 'add').mockRejectedValueOnce(new Error('database is locked'))
    fireEvent.change(campoNome(), { target: { value: 'Churrasco' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(dialog()).toHaveTextContent('Não foi possível salvar a lista. Tente novamente.'))
    expect(dialog()).not.toHaveTextContent('locked')
    fecharDialog()
    expect(campoNome()).toHaveValue('Churrasco')
  })

  it('pede o armazenamento persistente depois de gravar a primeira lista', async () => {
    reiniciarPedidoArmazenamento()
    const persist = vi.fn(() => Promise.resolve(false))
    // O jsdom não tem navigator.storage.
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist, persisted: () => Promise.resolve(false) },
    })
    onTestFinished(() => {
      Reflect.deleteProperty(navigator, 'storage')
    })

    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    expect(persist).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.getByText('1 lista')).toBeInTheDocument())
    expect(persist).toHaveBeenCalledTimes(1)
    // Negado: nenhum erro aparece.
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})

describe('menu do card', () => {
  it('o "⋮" abre o menu com o nome, Renomear, Excluir e Cancelar, sem abrir a lista', async () => {
    await criarLista('Churrasco domingo', new Date())
    renderizar()
    await screen.findByText('Churrasco domingo')
    abrirMenuPeloBotao('Churrasco domingo')

    const menu = screen.getByRole('dialog', { name: 'Churrasco domingo' })
    expect(within(menu).getByRole('button', { name: /Renomear/ })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /Excluir/ })).toHaveClass('menu-opcao--perigo')
    expect(within(menu).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    fireEvent.click(within(menu).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Churrasco domingo' })).not.toBeInTheDocument()
  })

  it('tocar fora fecha o menu', async () => {
    await criarLista('Churrasco domingo', new Date())
    renderizar()
    await screen.findByText('Churrasco domingo')
    abrirMenuPeloBotao('Churrasco domingo')
    const fundo = screen.getByTestId('fundo-menu')
    fireEvent.pointerDown(fundo)
    fireEvent.click(fundo)
    expect(screen.queryByRole('dialog', { name: 'Churrasco domingo' })).not.toBeInTheDocument()
  })

  it('Renomear abre o modal com o nome atual e salva o novo nome', async () => {
    await criarLista('Feira 30/10', new Date())
    renderizar()
    await screen.findByText('Feira 30/10')
    abrirMenuPeloBotao('Feira 30/10')
    fireEvent.click(screen.getByRole('button', { name: /Renomear/ }))

    expect(screen.queryByRole('dialog', { name: 'Feira 30/10' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Renomear lista' })).toBeInTheDocument()
    expect(campoNome()).toHaveValue('Feira 30/10')
    expect(campoNome()).toHaveFocus()

    fireEvent.change(campoNome(), { target: { value: 'Feira do sábado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Feira do sábado')).toBeInTheDocument()
    expect(screen.queryByText('Feira 30/10')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Renomear lista' })).not.toBeInTheDocument()
  })

  it('renomear uma lista que não existe mais avisa, fecha o modal e recarrega', async () => {
    const id = await criarLista('Feira 30/10', new Date())
    renderizar()
    await screen.findByText('Feira 30/10')
    abrirMenuPeloBotao('Feira 30/10')
    fireEvent.click(screen.getByRole('button', { name: /Renomear/ }))
    await banco.listas.delete(id)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(dialog()).toHaveTextContent('Esta lista não existe mais. Atualizamos a tela para você.'))
    expect(dialog()).toHaveTextContent('Atenção')
    expect(screen.queryByRole('dialog', { name: 'Renomear lista' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Feira 30/10')).not.toBeInTheDocument())
  })
})

describe('excluir lista', () => {
  it.each([
    ['Churrasco domingo', 7, '“Churrasco domingo” e seus 7 itens serão excluídos. Essa ação não pode ser desfeita.'],
    ['Frutas', 1, '“Frutas” e seu 1 item serão excluídos. Essa ação não pode ser desfeita.'],
    ['Feira 14/10', 0, '“Feira 14/10” será excluída. Essa ação não pode ser desfeita.'],
  ])('confirmação de "%s" com %i itens', async (nome, quantidade, mensagem) => {
    await criarLista(nome, new Date(), itensSemPreco(quantidade))
    renderizar()
    await screen.findByText(nome)
    abrirMenuPeloBotao(nome)
    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }))

    expect(screen.queryByRole('dialog', { name: nome })).not.toBeInTheDocument()
    expect(dialog()).toHaveTextContent('Excluir lista?')
    expect(dialog()).toHaveTextContent(mensagem)
  })

  it('Cancelar no dialog mantém o card', async () => {
    await criarLista('Frutas', new Date())
    renderizar()
    await screen.findByText('Frutas')
    abrirMenuPeloBotao('Frutas')
    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }))
    fecharDialog('Cancelar')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('Frutas')).toBeInTheDocument()
    expect(await banco.listas.count()).toBe(1)
  })

  it('confirmar tira o card e diminui o subtítulo', async () => {
    await criarLista('Frutas', new Date())
    await criarLista('Churrasco domingo', new Date(), itensSemPreco(7))
    renderizar()
    await screen.findByText('2 listas')
    abrirMenuPeloBotao('Churrasco domingo')
    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }))
    fecharDialog('Excluir')

    await waitFor(() => expect(screen.getByText('1 lista')).toBeInTheDocument())
    expect(screen.queryByText('Churrasco domingo')).not.toBeInTheDocument()
    expect(await banco.itens.count()).toBe(0)
  })

  it('excluir a última lista leva ao estado vazio e esconde o "+"', async () => {
    await criarLista('Frutas', new Date())
    renderizar()
    await screen.findByText('Frutas')
    abrirMenuPeloBotao('Frutas')
    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }))
    fecharDialog('Excluir')

    expect(await screen.findByText('Você ainda não tem listas')).toBeInTheDocument()
    expect(screen.getByText('nenhuma lista')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nova lista' })).not.toBeInTheDocument()
  })

  it('falha ao excluir mostra "Ops!" e o card continua', async () => {
    await criarLista('Frutas', new Date())
    renderizar()
    await screen.findByText('Frutas')
    vi.spyOn(banco.listas, 'delete').mockRejectedValueOnce(new Error('disk I/O error'))
    abrirMenuPeloBotao('Frutas')
    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }))
    fecharDialog('Excluir')

    await waitFor(() => expect(dialog()).toHaveTextContent('Não foi possível excluir a lista. Tente novamente.'))
    expect(screen.getByText('Frutas')).toBeInTheDocument()
    expect(await banco.listas.count()).toBe(1)
  })
})

describe('gestos do card', () => {
  let idLista: number

  async function prepararCard() {
    idLista = await criarLista('Feira do sábado', new Date())
    renderizar()
    await screen.findByText('Feira do sábado')
    return screen.getByRole('button', { name: /^Feira do sábado/ })
  }

  it('toque simples abre o detalhe da lista, marcando que veio de Listas', async () => {
    const area = await prepararCard()
    fireEvent.pointerDown(area, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.pointerUp(area, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.click(area)
    expect(window.location.hash).toBe(`#/lista/${idLista}`)
    expect(window.history.state).toMatchObject({ veioDeListas: true })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('toque longo de 500 ms abre o menu e, ao soltar, a lista não abre', async () => {
    const area = await prepararCard()
    vi.useFakeTimers()
    fireEvent.pointerDown(area, { clientX: 50, clientY: 50, pointerType: 'touch' })
    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(screen.queryByRole('dialog', { name: 'Feira do sábado' })).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByRole('dialog', { name: 'Feira do sábado' })).toBeInTheDocument()

    fireEvent.pointerUp(area, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.click(area)
    expect(window.location.hash).not.toContain('lista')
    expect(screen.getByRole('dialog', { name: 'Feira do sábado' })).toBeInTheDocument()
  })

  it('arrastar mais de 10 px não abre a lista nem o menu', async () => {
    const area = await prepararCard()
    vi.useFakeTimers()
    fireEvent.pointerDown(area, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.pointerMove(area, { clientX: 52, clientY: 70, pointerType: 'touch' })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    fireEvent.pointerUp(area, { clientX: 52, clientY: 70, pointerType: 'touch' })
    fireEvent.click(area)
    expect(window.location.hash).not.toContain('lista')
    expect(screen.queryByRole('dialog', { name: 'Feira do sábado' })).not.toBeInTheDocument()
  })

  it('o navegador assumir a rolagem (pointercancel) não abre a lista', async () => {
    const area = await prepararCard()
    fireEvent.pointerDown(area, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.pointerCancel(area, { pointerType: 'touch' })
    fireEvent.click(area)
    expect(window.location.hash).not.toContain('lista')
  })

  it('movimento de até 10 px ainda é toque', async () => {
    const area = await prepararCard()
    fireEvent.pointerDown(area, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.pointerMove(area, { clientX: 58, clientY: 60, pointerType: 'touch' })
    fireEvent.pointerUp(area, { clientX: 58, clientY: 60, pointerType: 'touch' })
    fireEvent.click(area)
    expect(window.location.hash).toBe(`#/lista/${idLista}`)
  })
})

describe('voltar do Android', () => {
  it('fecha o modal e continua em Listas', async () => {
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    voltarDoAndroid()
    expect(screen.queryByRole('dialog', { name: 'Nova lista' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Minhas Listas' })).toBeInTheDocument()
  })

  it('fecha o menu', async () => {
    await criarLista('Frutas', new Date())
    renderizar()
    await screen.findByText('Frutas')
    abrirMenuPeloBotao('Frutas')
    voltarDoAndroid()
    expect(screen.queryByRole('dialog', { name: 'Frutas' })).not.toBeInTheDocument()
  })

  it('fecha o "Excluir lista?" sem excluir', async () => {
    await criarLista('Frutas', new Date())
    renderizar()
    await screen.findByText('Frutas')
    abrirMenuPeloBotao('Frutas')
    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }))
    // Espera o history assentar da troca menu → dialog.
    await act(async () => {})
    voltarDoAndroid()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('Frutas')).toBeInTheDocument()
    expect(await banco.listas.count()).toBe(1)
  })

  it('com dialog sobre o modal, fecha uma camada por vez', async () => {
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Criar minha primeira lista' }))
    fireEvent.change(campoNome(), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(dialog()).toHaveTextContent('Atenção'))

    voltarDoAndroid()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Nova lista' })).toBeInTheDocument()

    voltarDoAndroid()
    expect(screen.queryByRole('dialog', { name: 'Nova lista' })).not.toBeInTheDocument()
  })
})
