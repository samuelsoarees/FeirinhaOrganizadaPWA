import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProvedorDialog } from '../componentes/ProvedorDialog'
import { ProvedorRepositorios } from '../componentes/ProvedorRepositorios'
import type { BancoFeira } from '../dados/banco'
import type { Repositorios } from '../dados/repositorios'
import { ErroArmazenamento } from '../dominio/erros'
import { ProvedorCamadas } from '../navegacao/ProvedorCamadas'
import { criarBancoDeTeste } from '../testes/bancoDeTeste'
import { TelaDetalheLista } from './TelaDetalheLista'

let banco: BancoFeira
let repositorios: Repositorios
let idLista: number

beforeEach(async () => {
  const criado = criarBancoDeTeste()
  banco = criado.banco
  repositorios = criado.repositorios
  idLista = await repositorios.listas.inserir('Feira do sábado')
})

afterEach(async () => {
  window.location.hash = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
  await banco.delete()
})

type NovoItem = { descricao: string; quantidade: number; valorUnitarioCentavos: number; concluido?: boolean }

async function criarItens(itens: NovoItem[]): Promise<number[]> {
  const ids: number[] = []
  for (const { concluido, ...dados } of itens) {
    const id = await repositorios.itens.inserir(idLista, dados)
    if (concluido) await banco.itens.update(id, { concluido: 1 })
    ids.push(id)
  }
  return ids
}

// A lista do mock (docs/mock-telas.html, tela 4), na ordem de inclusão.
const feiraDoSabado: NovoItem[] = [
  { descricao: 'Tomate', quantidade: 6, valorUnitarioCentavos: 120, concluido: true },
  { descricao: 'Abacaxi pérola', quantidade: 1, valorUnitarioCentavos: 800 },
  { descricao: 'Alface americana', quantidade: 2, valorUnitarioCentavos: 350, concluido: true },
  { descricao: 'Ovos caipira', quantidade: 12, valorUnitarioCentavos: 110, concluido: true },
  { descricao: 'Pimentão', quantidade: 3, valorUnitarioCentavos: 200 },
  { descricao: 'Manga palmer', quantidade: 4, valorUnitarioCentavos: 250, concluido: true },
]

function renderizar(id = idLista) {
  return render(
    <ProvedorCamadas>
      <ProvedorDialog>
        <ProvedorRepositorios repositorios={repositorios}>
          <TelaDetalheLista idLista={id} />
        </ProvedorRepositorios>
      </ProvedorDialog>
    </ProvedorCamadas>,
  )
}

async function renderizarPronta(itens: NovoItem[] = feiraDoSabado) {
  await criarItens(itens)
  renderizar()
  await screen.findByRole('button', { name: '+ Adicionar item' })
}

function dialog() {
  return screen.getByRole('alertdialog')
}

function fecharDialog(nomeBotao = 'OK') {
  fireEvent.click(within(dialog()).getByRole('button', { name: nomeBotao }))
}

function linha(descricao: string): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(`^${descricao}`) })
}

function rodape(): HTMLElement {
  return screen.getByRole('contentinfo')
}

function painel(titulo = 'Novo item') {
  return screen.getByRole('dialog', { name: titulo })
}

function campo(rotulo: string): HTMLInputElement {
  return screen.getByLabelText(rotulo)
}

function abrirNovoItem() {
  fireEvent.click(screen.getByRole('button', { name: '+ Adicionar item' }))
}

function voltarDoAndroid() {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

function deslizar(elemento: HTMLElement, dx: number) {
  fireEvent.pointerDown(elemento, { clientX: 200, clientY: 50, pointerType: 'touch', pointerId: 1 })
  fireEvent.pointerMove(elemento, { clientX: 200 + dx / 2, clientY: 51, pointerType: 'touch', pointerId: 1 })
  fireEvent.pointerMove(elemento, { clientX: 200 + dx, clientY: 52, pointerType: 'touch', pointerId: 1 })
  fireEvent.pointerUp(elemento, { clientX: 200 + dx, clientY: 52, pointerType: 'touch', pointerId: 1 })
  fireEvent.click(elemento)
}

describe('exibir a lista', () => {
  it('cabeçalho com "‹", nome e "✎"', async () => {
    await renderizarPronta()
    expect(screen.getByRole('button', { name: 'Voltar' })).toHaveTextContent('‹')
    expect(screen.getByRole('heading', { level: 1, name: 'Feira do sábado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Renomear lista' })).toHaveTextContent('✎')
  })

  it('pendentes primeiro e concluídos abaixo de "Concluídos (N)", cada grupo na ordem de inclusão', async () => {
    await renderizarPronta()
    const textos = screen.getAllByRole('listitem').map((li) => li.querySelector('.item-desc')?.textContent ?? li.textContent)
    expect(textos).toEqual([
      'Abacaxi pérola',
      'Pimentão',
      'Concluídos (4)',
      'Tomate',
      'Alface americana',
      'Ovos caipira',
      'Manga palmer',
    ])
  })

  it('linha pendente com marcador vazio e subtotal em cinza; concluída com marcador verde e subtotal em destaque', async () => {
    await renderizarPronta()
    const pimentao = linha('Pimentão')
    expect(pimentao).toHaveTextContent('3 UN × R$ 2,00')
    expect(pimentao).toHaveTextContent('R$ 6,00')
    expect(pimentao).not.toHaveClass('item--ok')

    const tomate = linha('Tomate')
    expect(tomate).toHaveTextContent('6 UN × R$ 1,20')
    expect(tomate).toHaveTextContent('R$ 7,20')
    expect(tomate).toHaveClass('item--ok')
    expect(tomate.querySelector('.item-marcador')).toHaveTextContent('✓')
  })

  it('rodapé com o total concluído, a barra em 4/6 e o resumo', async () => {
    await renderizarPronta()
    expect(rodape()).toHaveTextContent('Total concluído')
    expect(rodape()).toHaveTextContent('R$ 37,40')
    expect(rodape()).toHaveTextContent('4 de 6 itens concluídos · previsto R$ 51,40')
    const barra = screen.getByRole('progressbar', { name: 'Itens concluídos' })
    expect(barra).toHaveAttribute('aria-valuenow', '4')
    expect(barra).toHaveAttribute('aria-valuemax', '6')
  })

  it('sem concluídos, o rótulo "Concluídos" não aparece', async () => {
    await renderizarPronta([{ descricao: 'Alho', quantidade: 1, valorUnitarioCentavos: 375 }])
    expect(screen.queryByText(/Concluídos/)).not.toBeInTheDocument()
    expect(rodape()).toHaveTextContent('R$ 0,00')
    expect(rodape()).toHaveTextContent('0 de 1 item concluído · previsto R$ 3,75')
  })

  it('lista vazia mostra o texto do estado vazio e o rodapé com R$ 0,00', async () => {
    renderizar()
    expect(await screen.findByText('Nenhum item ainda. Toque em + para adicionar.')).toBeInTheDocument()
    expect(rodape()).toHaveTextContent('R$ 0,00')
    expect(rodape()).toHaveTextContent('nenhum item · previsto R$ 0,00')
    expect(screen.getByRole('button', { name: '+ Adicionar item' })).toBeInTheDocument()
  })

  it('falha ao carregar mostra "Ops!" e o estado de erro; "Tentar novamente" recarrega', async () => {
    await criarItens([{ descricao: 'Alho', quantidade: 1, valorUnitarioCentavos: 375 }])
    const listar = vi
      .spyOn(repositorios.itens, 'listar')
      .mockRejectedValueOnce(new ErroArmazenamento('listar', new Error('database disk image is malformed')))

    renderizar()
    await waitFor(() => expect(dialog()).toHaveTextContent('Ops!'))
    expect(dialog()).toHaveTextContent('Não foi possível carregar os itens. Tente novamente.')
    expect(dialog()).not.toHaveTextContent('malformed')
    expect(screen.getByText('Não foi possível carregar os itens.')).toBeInTheDocument()

    fecharDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Alho')).toBeInTheDocument()
    expect(listar).toHaveBeenCalledTimes(2)
  })

  it('lista inexistente mostra o aviso e volta para Listas ao fechá-lo', async () => {
    window.location.hash = '#/lista/999'
    renderizar(999)
    await waitFor(() => expect(dialog()).toHaveTextContent('Atenção'))
    expect(dialog()).toHaveTextContent('Esta lista não existe mais. Atualizamos a tela para você.')
    expect(window.location.hash).toBe('#/lista/999')

    fecharDialog()
    await waitFor(() => expect(window.location.hash).toBe('#/'))
  })
})

describe('cadastrar item', () => {
  it('o painel abre com os valores iniciais e a descrição focada', async () => {
    await renderizarPronta()
    abrirNovoItem()
    expect(painel()).toBeInTheDocument()
    expect(campo('Descrição')).toHaveValue('')
    expect(campo('Descrição')).toHaveFocus()
    expect(campo('Descrição')).toHaveAttribute('maxLength', '80')
    expect(campo('Quantidade (UN)')).toHaveValue('1')
    expect(campo('Valor unitário')).toHaveValue('0,00')
    expect(campo('Valor unitário')).toHaveAttribute('inputMode', 'decimal')
    expect(within(painel()).getByText('Subtotal').parentElement).toHaveTextContent('R$ 0,00')
  })

  it('"Banana prata", 5 × R$ 0,75: o painel fecha e o item aparece como último pendente', async () => {
    await renderizarPronta()
    abrirNovoItem()
    fireEvent.change(campo('Descrição'), { target: { value: 'Banana prata' } })
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    fireEvent.change(campo('Valor unitário'), { target: { value: '075' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Novo item' })).not.toBeInTheDocument())
    const banana = await screen.findByRole('button', { name: /^Banana prata/ })
    expect(banana).toHaveTextContent('5 UN × R$ 0,75')
    expect(banana).toHaveTextContent('R$ 3,75')
    const textos = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(textos.indexOf(banana.closest('li')!.textContent)).toBe(2)
    expect(textos[3]).toBe('Concluídos (4)')
    expect(rodape()).toHaveTextContent('previsto R$ 55,15')
  })

  it('prévia do subtotal acompanha a digitação do valor com máscara de centavos', async () => {
    await renderizarPronta()
    abrirNovoItem()
    fireEvent.change(campo('Quantidade (UN)'), { target: { value: '5' } })
    const valor = campo('Valor unitário')
    fireEvent.change(valor, { target: { value: '0,007' } })
    expect(valor).toHaveValue('0,07')
    fireEvent.change(valor, { target: { value: '0,075' } })
    expect(valor).toHaveValue('0,75')
    expect(within(painel()).getByText('Subtotal').parentElement).toHaveTextContent('R$ 3,75')
  })

  it('o valor não passa de R$ 99.999,99', async () => {
    await renderizarPronta()
    abrirNovoItem()
    const valor = campo('Valor unitário')
    fireEvent.change(valor, { target: { value: '9999999' } })
    expect(valor).toHaveValue('99.999,99')
    fireEvent.change(valor, { target: { value: '99.999,999' } })
    expect(valor).toHaveValue('99.999,99')
  })

  it('o "–" não desce de 1 e o "+" não passa de 999', async () => {
    await renderizarPronta()
    abrirNovoItem()
    fireEvent.click(screen.getByRole('button', { name: 'Diminuir quantidade' }))
    expect(campo('Quantidade (UN)')).toHaveValue('1')
    fireEvent.change(campo('Quantidade (UN)'), { target: { value: '999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    expect(campo('Quantidade (UN)')).toHaveValue('999')
  })

  it('Cancelar fecha sem gravar e tocar fora não fecha', async () => {
    await renderizarPronta([])
    abrirNovoItem()
    fireEvent.change(campo('Descrição'), { target: { value: 'Alho' } })
    fireEvent.click(screen.getByTestId('fundo-painel'))
    expect(campo('Descrição')).toHaveValue('Alho')

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Novo item' })).not.toBeInTheDocument()
    expect(await banco.itens.count()).toBe(0)
  })

  it('sem descrição mostra "Atenção" e o painel continua aberto com a quantidade 3', async () => {
    await renderizarPronta([])
    abrirNovoItem()
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(dialog()).toHaveTextContent('Atenção'))
    expect(dialog()).toHaveTextContent('Informe a descrição do item.')
    fecharDialog()
    expect(painel()).toBeInTheDocument()
    expect(campo('Quantidade (UN)')).toHaveValue('3')
    expect(await banco.itens.count()).toBe(0)
  })

  it('quantidade apagada é recusada pela regra', async () => {
    await renderizarPronta([])
    abrirNovoItem()
    fireEvent.change(campo('Descrição'), { target: { value: 'Alho' } })
    fireEvent.change(campo('Quantidade (UN)'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar item' }))
    await waitFor(() => expect(dialog()).toHaveTextContent('A quantidade deve ser um número inteiro de 1 a 999.'))
  })

  it('toque duplo em "Salvar item" cria um item só', async () => {
    await renderizarPronta([])
    abrirNovoItem()
    fireEvent.change(campo('Descrição'), { target: { value: 'Alho' } })
    const salvar = screen.getByRole('button', { name: 'Salvar item' })
    fireEvent.click(salvar)
    fireEvent.click(salvar)
    expect(await screen.findByText('Alho')).toBeInTheDocument()
    expect(await banco.itens.count()).toBe(1)
  })

  it('falha ao salvar mostra "Ops!" e o painel continua aberto com os valores', async () => {
    await renderizarPronta([])
    vi.spyOn(repositorios.itens, 'inserir').mockRejectedValue(new ErroArmazenamento('salvar', new Error('QuotaExceededError')))
    abrirNovoItem()
    fireEvent.change(campo('Descrição'), { target: { value: 'Alho' } })
    fireEvent.change(campo('Valor unitário'), { target: { value: '375' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(dialog()).toHaveTextContent('Ops!'))
    expect(dialog()).toHaveTextContent('Não foi possível salvar o item. Tente novamente.')
    expect(dialog()).not.toHaveTextContent('Quota')
    fecharDialog()
    expect(campo('Descrição')).toHaveValue('Alho')
    expect(campo('Valor unitário')).toHaveValue('3,75')
  })

  it('gravar numa lista que não existe mais avisa e volta para Listas', async () => {
    await renderizarPronta([])
    await banco.listas.delete(idLista)
    abrirNovoItem()
    fireEvent.change(campo('Descrição'), { target: { value: 'Alho' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(dialog()).toHaveTextContent('Esta lista não existe mais. Atualizamos a tela para você.'))
    expect(screen.queryByRole('dialog', { name: 'Novo item' })).not.toBeInTheDocument()
    fecharDialog()
    await waitFor(() => expect(window.location.hash).toBe('#/'))
  })
})

describe('editar item', () => {
  it('tocar na linha abre "Editar item" com os dados; salvar mantém o grupo', async () => {
    await renderizarPronta()
    fireEvent.click(linha('Tomate'))
    expect(painel('Editar item')).toBeInTheDocument()
    expect(campo('Descrição')).toHaveValue('Tomate')
    expect(campo('Quantidade (UN)')).toHaveValue('6')
    expect(campo('Valor unitário')).toHaveValue('1,20')
    expect(screen.getByRole('button', { name: 'Excluir item' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument())
    await waitFor(() => expect(linha('Tomate')).toHaveTextContent('8 UN × R$ 1,20'))
    const tomate = linha('Tomate')
    expect(tomate).toHaveTextContent('R$ 9,60')
    expect(tomate).toHaveClass('item--ok')
    expect(rodape()).toHaveTextContent('R$ 39,80')
  })

  it('item que não existe mais avisa, fecha o painel e recarrega', async () => {
    const [, abacaxi] = await criarItens(feiraDoSabado)
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: /^Abacaxi pérola/ }))
    await banco.itens.delete(abacaxi)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(dialog()).toHaveTextContent('Este item não existe mais. Atualizamos a tela para você.'))
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Abacaxi pérola')).not.toBeInTheDocument())
    expect(rodape()).toHaveTextContent('4 de 5 itens concluídos')
  })
})

function marcador(descricao: string): HTMLElement {
  return screen.getByRole('checkbox', { name: `Marcar ${descricao} como concluído` })
}

function ordemNaTela(): string[] {
  return screen.getAllByRole('listitem').map((li) => li.querySelector('.item-desc')?.textContent ?? li.textContent ?? '')
}

async function concluidoNoBanco(descricao: string): Promise<boolean> {
  const registros = await banco.itens.toArray()
  return registros.find((registro) => registro.descricao === descricao)?.concluido === 1
}

describe('marcar e desmarcar item', () => {
  it('marcar "Pimentão" desce para os concluídos, sem abrir o painel, e atualiza rótulo e rodapé', async () => {
    await renderizarPronta()
    expect(marcador('Pimentão')).not.toBeChecked()
    expect(rodape()).toHaveTextContent('R$ 37,40')

    fireEvent.click(marcador('Pimentão'))

    await waitFor(() => expect(marcador('Pimentão')).toBeChecked())
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()
    expect(ordemNaTela()).toEqual([
      'Abacaxi pérola',
      'Concluídos (5)',
      'Tomate',
      'Alface americana',
      'Ovos caipira',
      'Pimentão',
      'Manga palmer',
    ])
    expect(linha('Pimentão')).toHaveClass('item--ok')
    expect(rodape()).toHaveTextContent('R$ 43,40')
    expect(rodape()).toHaveTextContent('5 de 6 itens concluídos · previsto R$ 51,40')
    expect(screen.getByRole('progressbar', { name: 'Itens concluídos' })).toHaveAttribute('aria-valuenow', '5')
    expect(await concluidoNoBanco('Pimentão')).toBe(true)
  })

  it('desmarcar "Tomate" volta à posição de inclusão, com o subtotal em cinza, e diminui o total', async () => {
    await renderizarPronta()
    fireEvent.click(marcador('Tomate'))

    await waitFor(() => expect(marcador('Tomate')).not.toBeChecked())
    expect(ordemNaTela()).toEqual([
      'Tomate',
      'Abacaxi pérola',
      'Pimentão',
      'Concluídos (3)',
      'Alface americana',
      'Ovos caipira',
      'Manga palmer',
    ])
    expect(linha('Tomate')).not.toHaveClass('item--ok')
    expect(rodape()).toHaveTextContent('R$ 30,20')
    expect(rodape()).toHaveTextContent('3 de 6 itens concluídos · previsto R$ 51,40')
    expect(await concluidoNoBanco('Tomate')).toBe(false)
  })

  it('desmarcar o último concluído some com o rótulo "Concluídos"', async () => {
    await renderizarPronta([{ descricao: 'Alho', quantidade: 1, valorUnitarioCentavos: 300, concluido: true }])
    expect(screen.getByText('Concluídos (1)')).toBeInTheDocument()
    fireEvent.click(marcador('Alho'))
    await waitFor(() => expect(screen.queryByText(/^Concluídos/)).not.toBeInTheDocument())
    expect(rodape()).toHaveTextContent('0 de 1 item concluído · previsto R$ 3,00')
  })

  it('item de R$ 0,00 fica concluído e o total concluído não muda', async () => {
    await renderizarPronta([
      { descricao: 'Tomate', quantidade: 2, valorUnitarioCentavos: 150, concluido: true },
      { descricao: 'Cheiro-verde', quantidade: 1, valorUnitarioCentavos: 0 },
    ])
    fireEvent.click(marcador('Cheiro-verde'))
    await waitFor(() => expect(marcador('Cheiro-verde')).toBeChecked())
    expect(rodape()).toHaveTextContent('R$ 3,00')
    expect(rodape()).toHaveTextContent('2 de 2 itens concluídos · previsto R$ 3,00')
  })

  it('falha ao marcar mostra "Ops!" e o item continua pendente, no mesmo lugar', async () => {
    await renderizarPronta()
    vi.spyOn(repositorios.itens, 'marcar').mockRejectedValue(new ErroArmazenamento('marcar', new Error('disk I/O error')))
    const antes = ordemNaTela()

    fireEvent.click(marcador('Pimentão'))

    await waitFor(() => expect(dialog()).toHaveTextContent('Ops!'))
    expect(dialog()).toHaveTextContent('Não foi possível marcar o item. Tente novamente.')
    expect(dialog()).not.toHaveTextContent('disk')
    fecharDialog()
    expect(marcador('Pimentão')).not.toBeChecked()
    expect(ordemNaTela()).toEqual(antes)
    expect(rodape()).toHaveTextContent('R$ 37,40')
    expect(await concluidoNoBanco('Pimentão')).toBe(false)
  })

  it('toque duplo rápido no marcador: a tela mostra a mesma marcação gravada no banco', async () => {
    await renderizarPronta()
    fireEvent.click(marcador('Pimentão'))
    fireEvent.click(marcador('Pimentão'))

    await waitFor(() => expect(screen.queryByTestId('bloqueio-toques')).not.toBeInTheDocument())
    const naTela = marcador('Pimentão').getAttribute('aria-checked') === 'true'
    expect(naTela).toBe(await concluidoNoBanco('Pimentão'))
  })

  it('dois toques, esperando cada um, voltam o item à posição de inclusão', async () => {
    await renderizarPronta()
    fireEvent.click(marcador('Pimentão'))
    await waitFor(() => expect(marcador('Pimentão')).toBeChecked())
    fireEvent.click(marcador('Pimentão'))
    await waitFor(() => expect(marcador('Pimentão')).not.toBeChecked())
    expect(ordemNaTela().slice(0, 2)).toEqual(['Abacaxi pérola', 'Pimentão'])
    expect(await concluidoNoBanco('Pimentão')).toBe(false)
  })

  it('item que não existe mais avisa e recarrega os itens', async () => {
    const ids = await criarItens(feiraDoSabado)
    renderizar()
    await screen.findByRole('button', { name: '+ Adicionar item' })
    await banco.itens.delete(ids[4])

    fireEvent.click(marcador('Pimentão'))

    await waitFor(() => expect(dialog()).toHaveTextContent('Este item não existe mais. Atualizamos a tela para você.'))
    fecharDialog()
    await waitFor(() => expect(screen.queryByText('Pimentão')).not.toBeInTheDocument())
    expect(rodape()).toHaveTextContent('4 de 5 itens concluídos')
  })

  it('Enter no marcador não abre a edição', async () => {
    await renderizarPronta()
    fireEvent.keyDown(marcador('Pimentão'), { key: 'Enter' })
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()
  })

  it('com o "Excluir" revelado, tocar num marcador só esconde o botão', async () => {
    await renderizarPronta()
    deslizar(linha('Pimentão'), -80)
    const abacaxi = marcador('Abacaxi pérola')
    fireEvent.pointerDown(abacaxi, { clientX: 20, clientY: 50, pointerType: 'touch' })
    fireEvent.pointerUp(abacaxi, { clientX: 20, clientY: 50, pointerType: 'touch' })
    fireEvent.click(abacaxi)
    expect(screen.queryByRole('button', { name: 'Excluir Pimentão' })).not.toBeInTheDocument()
    expect(marcador('Abacaxi pérola')).not.toBeChecked()
    expect(screen.queryByTestId('bloqueio-toques')).not.toBeInTheDocument()
  })
})

describe('excluir item', () => {
  it('deslizar revela "Excluir"; confirmar tira a linha e recalcula o rodapé', async () => {
    await renderizarPronta()
    expect(screen.queryByRole('button', { name: 'Excluir Pimentão' })).not.toBeInTheDocument()
    deslizar(linha('Pimentão'), -80)
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Pimentão' }))
    expect(dialog()).toHaveTextContent('Excluir item?')
    expect(dialog()).toHaveTextContent('“Pimentão” será excluído. Essa ação não pode ser desfeita.')
    fecharDialog('Excluir')

    await waitFor(() => expect(screen.queryByText('Pimentão')).not.toBeInTheDocument())
    expect(rodape()).toHaveTextContent('4 de 5 itens concluídos · previsto R$ 45,40')
  })

  it('deslize curto ou de volta esconde o "Excluir"', async () => {
    await renderizarPronta()
    deslizar(linha('Pimentão'), -20)
    expect(screen.queryByRole('button', { name: 'Excluir Pimentão' })).not.toBeInTheDocument()

    deslizar(linha('Pimentão'), -80)
    expect(screen.getByRole('button', { name: 'Excluir Pimentão' })).toBeInTheDocument()
    deslizar(linha('Pimentão'), 80)
    expect(screen.queryByRole('button', { name: 'Excluir Pimentão' })).not.toBeInTheDocument()
  })

  it('tocar em outra linha esconde o "Excluir" sem abrir a edição', async () => {
    await renderizarPronta()
    deslizar(linha('Pimentão'), -80)
    const abacaxi = linha('Abacaxi pérola')
    fireEvent.pointerDown(abacaxi, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.pointerUp(abacaxi, { clientX: 50, clientY: 50, pointerType: 'touch' })
    fireEvent.click(abacaxi)
    expect(screen.queryByRole('button', { name: 'Excluir Pimentão' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()
  })

  it('rolar na vertical não revela nem abre a edição', async () => {
    await renderizarPronta()
    const pimentao = linha('Pimentão')
    fireEvent.pointerDown(pimentao, { clientX: 200, clientY: 50, pointerType: 'touch' })
    fireEvent.pointerMove(pimentao, { clientX: 195, clientY: 80, pointerType: 'touch' })
    fireEvent.pointerCancel(pimentao, { pointerType: 'touch' })
    fireEvent.click(pimentao)
    expect(screen.queryByRole('button', { name: 'Excluir Pimentão' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()
  })

  it('pelo painel: "Excluir item" e confirmar fecha o painel e tira o item', async () => {
    await renderizarPronta()
    fireEvent.click(linha('Alface americana'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir item' }))
    expect(dialog()).toHaveTextContent('“Alface americana” será excluído.')
    fecharDialog('Excluir')

    await waitFor(() => expect(screen.queryByText('Alface americana')).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()
    expect(screen.getByText('Concluídos (3)')).toBeInTheDocument()
  })

  it('Cancelar no "Excluir item?" mantém o item', async () => {
    await renderizarPronta()
    deslizar(linha('Pimentão'), -80)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Pimentão' }))
    fecharDialog('Cancelar')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(linha('Pimentão')).toBeInTheDocument()
    expect(await banco.itens.count()).toBe(6)
  })

  it('falha ao excluir mostra "Ops!" e o item continua', async () => {
    await renderizarPronta()
    vi.spyOn(repositorios.itens, 'excluir').mockRejectedValue(new ErroArmazenamento('excluir', new Error('disk I/O error')))
    fireEvent.click(linha('Pimentão'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir item' }))
    fecharDialog('Excluir')

    await waitFor(() => expect(dialog()).toHaveTextContent('Não foi possível excluir o item. Tente novamente.'))
    fecharDialog()
    expect(painel('Editar item')).toBeInTheDocument()
    expect(linha('Pimentão')).toBeInTheDocument()
  })
})

describe('renomear pelo detalhe', () => {
  it('"✎" abre "Renomear lista" com o nome atual e o cabeçalho mostra o novo nome', async () => {
    await renderizarPronta()
    fireEvent.click(screen.getByRole('button', { name: 'Renomear lista' }))
    const campoNome = campo('Nome da lista')
    expect(screen.getByRole('dialog', { name: 'Renomear lista' })).toBeInTheDocument()
    expect(campoNome).toHaveValue('Feira do sábado')
    expect([campoNome.selectionStart, campoNome.selectionEnd]).toEqual([0, 'Feira do sábado'.length])

    fireEvent.change(campoNome, { target: { value: 'Feira de domingo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Feira de domingo' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Renomear lista' })).not.toBeInTheDocument()
  })
})

describe('voltar', () => {
  it('o voltar do Android com o painel aberto fecha sem gravar e continua no detalhe', async () => {
    await renderizarPronta([])
    abrirNovoItem()
    fireEvent.change(campo('Descrição'), { target: { value: 'Alho' } })
    voltarDoAndroid()
    expect(screen.queryByRole('dialog', { name: 'Novo item' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Feira do sábado' })).toBeInTheDocument()
    expect(await banco.itens.count()).toBe(0)
  })

  it('fecha uma camada por vez: dialog e depois painel', async () => {
    await renderizarPronta()
    fireEvent.click(linha('Pimentão'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir item' }))
    voltarDoAndroid()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(painel('Editar item')).toBeInTheDocument()
    voltarDoAndroid()
    expect(screen.queryByRole('dialog', { name: 'Editar item' })).not.toBeInTheDocument()
    expect(await banco.itens.count()).toBe(6)
  })

  it('o voltar do Android fecha o modal de renomear', async () => {
    await renderizarPronta()
    fireEvent.click(screen.getByRole('button', { name: 'Renomear lista' }))
    voltarDoAndroid()
    expect(screen.queryByRole('dialog', { name: 'Renomear lista' })).not.toBeInTheDocument()
  })
})

function abrirOpcoes() {
  fireEvent.click(screen.getByRole('button', { name: 'Opções da lista' }))
  return screen.getByRole('dialog', { name: 'Opções da lista' })
}

function escolherOpcao(rotulo: 'Desmarcar todos' | 'Zerar preços') {
  fireEvent.click(within(abrirOpcoes()).getByRole('button', { name: rotulo }))
}

describe('opções da lista', () => {
  it('o cabeçalho mostra "✎" e "⋯" com a lista carregada', async () => {
    await renderizarPronta()
    expect(screen.getByRole('button', { name: 'Opções da lista' })).toHaveTextContent('⋯')
    expect(screen.getByRole('button', { name: 'Opções da lista' })).toBeEnabled()
  })

  it('enquanto a lista carrega, "✎" e "⋯" ficam escondidos', async () => {
    vi.spyOn(repositorios.itens, 'listar').mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByRole('button', { name: 'Renomear lista' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Opções da lista' })).toBeDisabled()
  })

  it('"⋯" abre o menu com "Desmarcar todos", "Zerar preços" em vermelho e "Cancelar"', async () => {
    await renderizarPronta()
    const menu = abrirOpcoes()
    expect(within(menu).getAllByRole('button').map((botao) => botao.textContent)).toEqual([
      '○Desmarcar todos',
      '⊘Zerar preços',
      'Cancelar',
    ])
    expect(within(menu).getByRole('button', { name: 'Zerar preços' })).toHaveClass('menu-opcao--perigo')
    expect(within(menu).getByRole('button', { name: 'Desmarcar todos' })).not.toHaveClass('menu-opcao--perigo')
  })

  it('tocar fora fecha o menu sem alterar nada', async () => {
    await renderizarPronta()
    abrirOpcoes()
    const fundo = screen.getByTestId('fundo-menu')
    fireEvent.pointerDown(fundo)
    fireEvent.click(fundo)
    expect(screen.queryByRole('dialog', { name: 'Opções da lista' })).not.toBeInTheDocument()
    expect(screen.getByText('Concluídos (4)')).toBeInTheDocument()
  })

  it('"Cancelar" fecha o menu', async () => {
    await renderizarPronta()
    fireEvent.click(within(abrirOpcoes()).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Opções da lista' })).not.toBeInTheDocument()
  })

  it('o voltar do Android fecha só o menu e continua no detalhe', async () => {
    await renderizarPronta()
    abrirOpcoes()
    voltarDoAndroid()
    expect(screen.queryByRole('dialog', { name: 'Opções da lista' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Feira do sábado' })).toBeInTheDocument()
  })
})

async function quantosConcluidosNoBanco(): Promise<number> {
  return banco.itens.filter((registro) => registro.concluido === 1).count()
}

describe('desmarcar todos pela tela', () => {
  it('confirmar volta todos para os pendentes na ordem de inclusão e atualiza o rodapé', async () => {
    await renderizarPronta()
    escolherOpcao('Desmarcar todos')
    expect(screen.queryByRole('dialog', { name: 'Opções da lista' })).not.toBeInTheDocument()
    expect(dialog()).toHaveTextContent('Desmarcar todos os itens?')
    expect(dialog()).toHaveTextContent('Os 4 itens concluídos voltarão para os pendentes.')

    fecharDialog('Desmarcar')

    await waitFor(() => expect(screen.queryByText(/^Concluídos/)).not.toBeInTheDocument())
    expect(ordemNaTela()).toEqual(['Tomate', 'Abacaxi pérola', 'Alface americana', 'Ovos caipira', 'Pimentão', 'Manga palmer'])
    expect(rodape()).toHaveTextContent('R$ 0,00')
    expect(rodape()).toHaveTextContent('0 de 6 itens concluídos · previsto R$ 51,40')
    expect(await quantosConcluidosNoBanco()).toBe(0)
  })

  it('com um item concluído, a mensagem fica no singular', async () => {
    await renderizarPronta([{ descricao: 'Tomate', quantidade: 6, valorUnitarioCentavos: 120, concluido: true }])
    escolherOpcao('Desmarcar todos')
    expect(dialog()).toHaveTextContent('O 1 item concluído voltará para os pendentes.')
  })

  it('"Cancelar" fecha o dialog e os concluídos continuam', async () => {
    await renderizarPronta()
    escolherOpcao('Desmarcar todos')
    fecharDialog('Cancelar')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByText('Concluídos (4)')).toBeInTheDocument()
    expect(await quantosConcluidosNoBanco()).toBe(4)
  })

  it('sem concluídos, avisa "Nenhum item concluído para desmarcar." e não grava', async () => {
    await renderizarPronta(feiraDoSabado.map((item) => ({ ...item, concluido: false })))
    const desmarcarTodos = vi.spyOn(repositorios.itens, 'desmarcarTodos')
    escolherOpcao('Desmarcar todos')
    expect(dialog()).toHaveTextContent('Atenção')
    expect(dialog()).toHaveTextContent('Nenhum item concluído para desmarcar.')
    expect(within(dialog()).getAllByRole('button').map((botao) => botao.textContent)).toEqual(['OK'])
    fecharDialog()
    expect(desmarcarTodos).not.toHaveBeenCalled()
  })

  it('falha mostra "Ops!" e os itens continuam concluídos', async () => {
    await renderizarPronta()
    vi.spyOn(repositorios.itens, 'desmarcarTodos').mockRejectedValue(
      new ErroArmazenamento('desmarcar', new Error('disk I/O error')),
    )
    escolherOpcao('Desmarcar todos')
    fecharDialog('Desmarcar')
    await waitFor(() => expect(dialog()).toHaveTextContent('Ops!'))
    expect(dialog()).toHaveTextContent('Não foi possível desmarcar os itens. Tente novamente.')
    expect(dialog()).not.toHaveTextContent('disk')
    fecharDialog()
    expect(screen.getByText('Concluídos (4)')).toBeInTheDocument()
  })

  it('lista que não existe mais avisa e volta para Listas', async () => {
    window.location.hash = `#/lista/${idLista}`
    await renderizarPronta()
    await repositorios.listas.excluir(idLista)
    escolherOpcao('Desmarcar todos')
    fecharDialog('Desmarcar')
    await waitFor(() => expect(dialog()).toHaveTextContent('Esta lista não existe mais. Atualizamos a tela para você.'))
    fecharDialog()
    await waitFor(() => expect(window.location.hash).toBe('#/'))
  })
})
