## Context

- O motivo está em `proposal.md` (Why), e os requisitos nos deltas de `itens` e `tela-detalhe-lista` desta change.
- O app já tem as peças necessárias:
  - `MenuInferior`, o menu que sobe de baixo, usado no card e no Backup da tela de Listas;
  - `Dialog`, via `useDialog`, para confirmações e avisos;
  - `useOperacao`, que bloqueia toques e mostra o indicador depois de 300 ms;
  - `useCamada`, que liga cada camada ao voltar do Android;
  - `useAnimacaoFlip`, que anima a troca de posição das linhas.
- Banco: a tabela `itens` tem o índice `idLista`. Valores ficam em `valorUnitarioCentavos`, e `concluido` é gravado como 0/1. Nada disso muda.
- Mock: `mock.html` nesta pasta. Ele é uma cópia estática do visual de `docs/mock-telas.html` com as telas novas.

## Goals / Non-Goals

**Goals:**
- Cada ação em massa é uma gravação atômica: tudo ou nada.
- Reaproveitar os componentes existentes, sem componente visual novo.
- Regras e contagens no `dominio/`, cobertas por Vitest, como o resto do app.

**Non-Goals:**
- Desfazer a ação, por exemplo com um aviso "Desfazer" depois de zerar.
- Selecionar alguns itens para a ação. Ela vale sempre para a lista inteira.
- Zerar quantidades, que saiu do escopo (ver `proposal.md`).
- Ações em massa na tela de Listas (no card).

## Decisions

### 1. Onde ficam as opções: botão "⋯" no cabeçalho
Foram avaliadas três abordagens:

| Abordagem | Prós | Contras |
| --- | --- | --- |
| **"⋯" ao lado do "✎" (escolhida)** | Reaproveita o `MenuInferior`. Não ocupa espaço na lista. Fica longe do polegar, então é difícil tocar sem querer. Abre espaço para opções futuras. | Exige um toque a mais e a opção fica menos visível. |
| Trocar o "✎" por "⋯" e pôr Renomear no menu | Cabeçalho mais limpo. | Renomear passa a pedir dois toques, e o requisito atual do "✎" muda sem necessidade. |
| Atalhos fixos acima do rodapé | Sempre visíveis. | Tiram altura da lista e ficam perto do "+ Adicionar item", o que aumenta o risco de zerar sem querer. |

O usuário escolheu a primeira. O "⋯" usa a mesma classe `topo-detalhe-acao` do "✎", e por isso também fica escondido (`disabled` → `visibility: hidden`) até a lista carregar.

### 2. Repositório: duas operações em lote, cada uma numa transação
Em `RepositorioItens`:

```ts
desmarcarTodos(idLista: number): Promise<number>  // quantos itens foram desmarcados
zerarPrecos(idLista: number): Promise<number>     // quantos itens tinham preço e foram zerados
```

Cada operação roda numa `transaction('rw', listas, itens)`:
1. lê a lista e, se ela não existir, lança `erroListaNaoEncontrada()`;
2. grava com `itens.where('idLista').equals(idLista).filter(...).modify(...)`;
3. devolve a contagem do `modify`.

O `modify` só toca os registros do filtro: `concluido === 1` para desmarcar, `valorUnitarioCentavos > 0` para zerar. Assim a contagem é exata e não há escrita sem efeito. Tudo vai dentro de `protegido(...)` com as operações novas `'desmarcar'` e `'zerar'` em `OperacaoArmazenamento`.

- **Alternativa descartada**: chamar `marcar()` ou `editar()` item a item a partir da tela. São N transações, e uma falha no meio deixaria a lista meio alterada, contra o requisito de não alterar dados parcialmente.
- **Alternativa descartada**: usar o índice `[idLista+concluido]` para desmarcar. Ele funcionaria, mas o `where('idLista')` com `filter` cobre as duas operações do mesmo jeito, e as listas têm dezenas de itens, não milhares.

### 3. Domínio: contagens e mensagens
- Em `dominio/itens.ts`, `contarComPreco(itens): number` conta os itens com `valorUnitarioCentavos > 0`. O número de concluídos já vem de `resumirItens(itens).quantidadeConcluidos`.
- Em `mensagens.ts`, os textos exatos da spec, com singular e plural no mesmo padrão de `listas.excluirMensagem`:
  - `detalhe.opcoesDaLista`, `detalhe.desmarcarTodos`, `detalhe.zerarPrecos`;
  - `detalhe.desmarcarTitulo`, `detalhe.desmarcarMensagem(n)`, `detalhe.desmarcar`;
  - `detalhe.zerarTitulo`, `detalhe.zerarMensagem(n)`, `detalhe.zerar`;
  - `detalhe.nadaParaDesmarcar`, `detalhe.nadaParaZerar`;
  - `detalhe.falhaDesmarcar`, `detalhe.falhaZerar`.

### 4. Tela: fluxo de cada ação
Em `TelaDetalheLista`:
- estado novo `menuOpcoes: boolean`;
- um `<MenuInferior>` com as duas opções, a segunda com `perigo: true`.

Fluxo comum a `desmarcarTodos()` e `zerarPrecos()`:
1. Fechar o menu.
2. Contar no estado da tela. Com 0, mostrar o "Atenção" no mesmo padrão do `backup.semListas` da tela de Listas (ícone `alerta`, só o botão "OK") e sair sem gravar.
3. Confirmar com `mostrarDialog` (ícone `alerta`). Se o usuário cancelar, sair.
4. Rodar no `executar(...)` com a `mensagemFalha` da operação.
5. Com sucesso, recarregar os itens com `carregar()`. A ordem e os totais vêm do banco, e o `useAnimacaoFlip` anima as linhas que voltam aos pendentes.
6. Com `ErroNaoEncontrado` da lista, chamar `sairListaInexistente`.

A contagem da confirmação vem da tela, e a gravação vale para o que está no banco no momento. Como o app é de um aparelho só, os dois coincidem. Se outra aba tiver mudado algo, o `carregar()` do passo 5 mostra o estado real.

Fechar o menu e abrir o dialog no mesmo toque já funciona, porque a `PilhaCamadas` reaproveita a entrada do `history` com `replaceState` (nota da tarefa 2.6 da change arquivada). O voltar fecha na ordem da spec sem código novo, porque cada camada se registra com `useCamada`.

### 5. Ícones e cores
- "○" para "Desmarcar todos": é o mesmo desenho do marcador vazio.
- "⊘" para "Zerar preços", com `menu-opcao--perigo` (vermelho), como o "Excluir" do card.

Os dois são caracteres Unicode simples, como os ícones atuais ("✎", "🗑", "⇪"), sem fonte de ícones.

## Risks / Trade-offs

- [Zerar preços sem querer apaga o preço de todos os itens] → A confirmação diz quantos itens mudam e avisa que não dá para desfazer. A opção fica em vermelho e a dois toques de distância. Um "Desfazer" fica para depois, se o uso pedir.
- [Animação FLIP com muitas linhas mudando de uma vez pode engasgar em aparelho fraco] → O `useAnimacaoFlip` já anima o lote inteiro. Validar no Android com 30 ou mais itens no roteiro do celular. Se engasgar, desligar a animação quando mais de 20 linhas mudam.
- [Contagem da tela diferente do banco, com duas abas abertas] → É aceitável. O resultado gravado é o correto, e a tela recarrega logo depois.

## Migration Plan

- Sem migração: o schema e o formato do backup não mudam.
- Para publicar, subir a versão (`npm version 26.11.4 --no-git-tag-version`, ou o número seguinte do mês), fazer push na `main` e o workflow publica no GitHub Pages.
- Para desfazer, reverter o commit. Como não há dado novo gravado, a versão anterior continua lendo o banco normalmente.
