## Why

Quem faz feira toda semana reaproveita a mesma lista. Hoje, para começar a feira seguinte, o usuário precisa tocar no marcador de cada item concluído e abrir item por item para apagar o preço da semana anterior, que quase sempre muda. Duas ações em massa na tela de itens resolvem isso em poucos toques: **desmarcar todos** e **zerar preços**.

## What Changes

- Novo botão **"⋯"** no cabeçalho do detalhe da lista, ao lado do "✎", que abre o menu **"Opções da lista"**. É o mesmo menu que sobe da parte de baixo da tela, já usado no card e no Backup.
- Opção **"Desmarcar todos"**: depois de confirmar, todos os itens concluídos da lista voltam para pendentes, cada um na sua posição de inclusão. Descrição, quantidade e valor não mudam.
- Opção **"Zerar preços"**, em vermelho: depois de confirmar, o valor unitário de todos os itens da lista passa a R$ 0,00. Descrição, quantidade, marcação e posição não mudam, e o total concluído e o previsto vão a R$ 0,00.
- Cada ação grava tudo ou nada. Se o banco falhar, nenhum item muda.
- Quando a ação não tem efeito (nenhum item concluído, ou nenhum item com preço), o app avisa e não grava nada.
- O voltar do Android passa a fechar também o menu "Opções da lista".
- Mock das telas novas em `openspec/changes/acoes-em-massa-itens/mock.html`.

### Decisões tomadas na conversa

- **Fora do escopo: "Zerar quantidades".** A regra atual exige quantidade de 1 a 999, e o usuário preferiu não mexer nela.
- **Local das opções:** botão "⋯" no cabeçalho, escolhido entre três alternativas (ver `design.md`).

### Premissas assumidas (ajustáveis na revisão)

- As duas ações pedem confirmação. Só "Zerar preços" diz que a ação não pode ser desfeita, porque os preços se perdem. Os itens desmarcados podem ser marcados de novo.
- "Zerar preços" vale para todos os itens, pendentes e concluídos.
- O "✎" continua no cabeçalho, sem mudanças.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `itens`: duas regras novas, desmarcar todos os itens de uma lista e zerar os preços de uma lista, as duas gravadas de uma vez. A falha de armazenamento passa a cobrir essas duas operações.
- `tela-detalhe-lista`: o cabeçalho ganha o "⋯", e entram o menu "Opções da lista", as confirmações e os avisos das duas ações. O voltar do Android passa a fechar o menu, o indicador de carregamento passa a cobrir as duas operações e as falhas delas ganham mensagens próprias.

## Impact

- **Código:**
  - `src/dominio/`: `itens.ts` e `mensagens.ts`, e o tipo de operação em `erros.ts`;
  - `src/dados/repositorioItens.ts`: duas operações novas, cada uma numa transação;
  - `src/telas/TelaDetalheLista.tsx` e o CSS dela: botão "⋯" e menu, reaproveitando `MenuInferior` e `Dialog`.
- **Banco:** o schema não muda, porque não há campo novo. Não há nova `db.version`.
- **Backup:** o formato não muda.
- **Dependências:** nenhuma nova.
- **Versão:** sobe para `26.11.4`, ou para o número seguinte do mês na hora de publicar.
