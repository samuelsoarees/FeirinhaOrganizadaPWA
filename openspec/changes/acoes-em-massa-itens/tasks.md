Cada tarefa segue o ciclo de TDD: escrever o teste com os valores da spec, ver o teste falhar, implementar o mínimo, ver o teste passar e fazer o commit. Os requisitos estão nos deltas `specs/itens` e `specs/tela-detalhe-lista`, e o como está em `design.md`.

## 1. Domínio e dados

- [x] 1.1 Domínio. Incluir `'desmarcar' | 'zerar'` em `OperacaoArmazenamento` (`src/dominio/erros.ts`). Criar `contarComPreco(itens: readonly Item[]): number` em `src/dominio/itens.ts`. Incluir em `src/dominio/mensagens.ts` os textos da decisão 3 do design. Verificar: testes em `itens.test.ts` (lista vazia → 0; um item com R$ 0,00 e outro com R$ 4,00 → 1) e testes das mensagens no singular e no plural: "O 1 item concluído voltará para os pendentes.", "Os 4 itens concluídos voltarão para os pendentes.", "O 1 item com preço ficará com valor unitário R$ 0,00. Essa ação não pode ser desfeita." e "Os 5 itens com preço ficarão com valor unitário R$ 0,00. Essa ação não pode ser desfeita.".
- [x] 1.2 `RepositorioItens.desmarcarTodos(idLista): Promise<number>`, numa transação (decisão 2 do design). Verificar: testes em `repositorioItens.test.ts` com `fake-indexeddb`, um por cenário de "Desmarcar todos os itens da lista":
  - devolve 2 e mantém os dados;
  - mantém a ordem "Abacaxi", "Tomate", "Pimentão", "Alface";
  - devolve 0 sem concluídos;
  - não mexe na outra lista;
  - lança `ErroNaoEncontrado` de lista;
  - numa falha simulada, lança `ErroArmazenamento('desmarcar')` e os 4 itens continuam concluídos.
- [x] 1.3 `RepositorioItens.zerarPrecos(idLista): Promise<number>`, numa transação (decisão 2 do design). Verificar: testes, um por cenário de "Zerar os preços da lista":
  - devolve 2 e mantém quantidade e marcação;
  - deixa os totais em 0 com os mesmos concluídos;
  - devolve 1 com "Alho" já em R$ 0,00;
  - devolve 0 sem preços;
  - não mexe na outra lista;
  - lança `ErroNaoEncontrado` de lista;
  - numa falha simulada, lança `ErroArmazenamento('zerar')` e os 6 preços ficam como antes.
- [x] 1.4 Fechar o grupo. Verificar: `npm run lint`, `npm test` e `npm run build` passam.

## 2. Tela de detalhe

- [x] 2.1 Botão "⋯" no cabeçalho e menu "Opções da lista" (decisões 1 e 5 do design). O botão fica escondido enquanto a lista carrega. O menu tem "Desmarcar todos" (○), "Zerar preços" (⊘, perigo) e "Cancelar". Verificar: testes em `TelaDetalheLista.test.tsx`:
  - o cabeçalho mostra "✎" e "⋯" com a lista carregada e esconde os dois enquanto carrega;
  - o toque em "⋯" abre o menu com as opções na ordem;
  - o toque fora fecha o menu sem gravar;
  - o `popstate` com o menu aberto fecha só o menu.
- [x] 2.2 Fluxo de "Desmarcar todos" (decisão 4 do design). Verificar: testes de tela, um por cenário:
  - confirmar: 6 pendentes na ordem de inclusão, sem o rótulo "Concluídos", "R$ 0,00" e "0 de 6 itens concluídos · previsto R$ 51,40";
  - a mensagem no singular;
  - cancelar não grava;
  - sem concluídos aparece "Nenhum item concluído para desmarcar." e o banco não é chamado;
  - numa falha aparece "Não foi possível desmarcar os itens. Tente novamente." e os itens continuam em "Concluídos";
  - com a lista excluída aparece o aviso e a tela volta para Listas.
- [ ] 2.3 Fluxo de "Zerar preços" (decisão 4 do design). Verificar: testes de tela, um por cenário:
  - confirmar: "6 UN × R$ 0,00" e "R$ 0,00" no mesmo grupo, e "4 de 6 itens concluídos · previsto R$ 0,00";
  - a mensagem conta só os itens com preço (5 de 6);
  - cancelar não grava;
  - sem preços, ou com a lista vazia, aparece "Nenhum item com preço para zerar.";
  - numa falha aparece "Não foi possível zerar os preços. Tente novamente." e os preços ficam como antes;
  - com a lista excluída aparece o aviso e a tela volta para Listas;
  - um toque no marcador durante a gravação é ignorado.
- [ ] 2.4 Conferir lado a lado com `openspec/changes/acoes-em-massa-itens/mock.html` no `npm run dev` em 390 px (cabeçalho, menu, os dois dialogs e os avisos) e ajustar as diferenças. Verificar: `npm run lint`, `npm test` e `npm run build` passam.

## 3. Publicação e validação no celular

- [ ] 3.1 Subir a versão com `npm version 26.11.4 --no-git-tag-version`, ou o número seguinte do mês na data da publicação, e publicar na `main` com o OK do usuário. Verificar: o workflow fica verde e o rodapé de "Minhas Listas" mostra a nova versão.
- [ ] 3.2 **Validação no celular: ponto de parada.** Roteiro no iPhone (Safari, app instalado) e no Android (Chrome, app instalado):
  1. Numa lista com 30 ou mais itens, alguns concluídos, tocar em "⋯" e depois em "Desmarcar todos" e "Desmarcar". Todos voltam aos pendentes na ordem de inclusão, sem engasgar na animação.
  2. Marcar alguns itens, tocar em "⋯" e depois em "Zerar preços". Conferir a quantidade na mensagem e tocar em "Zerar". Os preços e os totais vão a R$ 0,00, e as marcações e quantidades ficam como estavam.
  3. Repetir as duas opções sem nada para fazer e ver os avisos "Atenção".
  4. No Android, com o menu aberto e depois com o dialog aberto, o voltar fecha uma camada por vez.
  5. Fechar o app por completo e reabrir: o resultado das ações continua gravado.

  Aguardar o OK do usuário.

## Workflow follow-up

- Arquivar a change depois do OK da validação no celular (`/opsx:archive`).
- Conferir se os specs principais `itens` e `tela-detalhe-lista` receberam os requisitos novos.
