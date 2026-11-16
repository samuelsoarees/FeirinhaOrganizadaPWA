## 1. Etapa 1 — Base instalável e publicada

- [x] 1.1 Confirmar com o usuário como o GitHub Pages fica disponível. Verificar: decisão registrada aqui na tarefa.
  - **Decisão (16/11/2026):** o PWA ganha um repositório próprio (`C:\Projects_Sam\Feira_Organizada_PWA`), separado do Delphi e criado **público** no GitHub, com GitHub Pages gratuito. Assim, o histórico do Delphi, que tem a chave web do Firebase em `uDAOLogin.pas`, continua privado. Criar o repositório no GitHub e configurar o `origin` fica com o usuário.
- [x] 1.2 Criar o projeto na raiz do repositório com Vite + React + TypeScript, ESLint, Vitest e os scripts `dev`, `build`, `preview`, `test` e `lint`. O `base` do build vem da variável `BASE_PATH`, com padrão `/`. Criar o `.gitignore` com `node_modules` e `dist`. Verificar: `npm run lint`, `npm test` (um teste trivial) e `npm run build` passam.
- [x] 1.3 Criar `estilo/tokens.css` e os estilos base: cores do PLANEJAMENTO, Nunito local via `@fontsource/nunito` (400/700/800) com `OFL.txt`, área segura e fundo `#181F3D`. Copiar a ilustração de `img/` para `public/barraca.png`. Verificar: `npm run dev` mostra o fundo azul-marinho e um texto de teste em Nunito.
- [x] 1.4 Criar o roteador por hash (`#/` e `#/lista/:id`) e a casca da tela "Minhas Listas" com o estado vazio estático do mock: ilustração, textos e botão "Criar minha primeira lista", que mostra "Em breve" por enquanto. Incluir a versão do build (hash do commit) em texto pequeno no rodapé. Verificar: recarregar em `#/lista/1` não dá 404 no `npm run preview` e mostra uma tela provisória.
- [x] 1.5 Criar o componente `Dialog` (card branco, título, mensagem, ícones de alerta/erro/info, botões) no padrão do TFancyDialog do mock, e a pilha de camadas com integração ao `history` (design, decisão 5). Verificar: teste com Testing Library mostrando que o `popstate` fecha só a camada do topo.
- [x] 1.6 Configurar o `vite-plugin-pwa`: manifest, precache, `registerType: 'prompt'`, ícones gerados pelo `@vite-pwa/assets-generator` e metas `apple-*` no `index.html`. Criar o aviso "Nova versão disponível" com "Atualizar". Verificar: Lighthouse (aba PWA/instalabilidade) sem erros no `npm run preview`; com a rede desligada no DevTools, o app recarrega.
  - **Nota (16/11/2026):** o Lighthouse não tem mais a categoria PWA (removida na versão 12). A verificação foi feita no `npm run preview`: manifest servido, service worker registrado com 19 arquivos no precache, app recarregando com o servidor parado, e "Nova versão disponível" → "Atualizar" trocando a versão do rodapé. A instalabilidade se confirma no celular, na 1.9.
- [x] 1.7 Criar a oferta de instalação: "Instalar app" pelo `beforeinstallprompt` no Android e o aviso do Safari iOS com "Agora não" lembrado em `localStorage`, escondidos no modo standalone. Verificar: testes unitários da detecção de plataforma e modo standalone.
- [x] 1.8 Criar `.github/workflows/pwa.yml` (lint, testes, build, deploy no GitHub Pages a partir da `main` e por `workflow_dispatch`). O usuário cria o repositório público no GitHub, configura o `origin` e ativa o Pages com a fonte "GitHub Actions". Verificar: o workflow fica verde e o endereço do Pages (`https://samuelsoarees.github.io/FeirinhaOrganizadaPWA/`) abre.
  - **Repositório (16/11/2026):** criado como `https://github.com/samuelsoarees/FeirinhaOrganizadaPWA` (nome diferente da pasta local). O `BASE_PATH` vem do `actions/configure-pages`, então o build já usa `/FeirinhaOrganizadaPWA/` sem mudança no código. Primeiro workflow verde em 16/11/2026 e o site abriu com a versão `a7dfc4f`.
- [x] 1.9 **Validação no celular — ponto de parada.** Roteiro, nos dois aparelhos:
  1. Android (Chrome): abrir o endereço, tocar em "Instalar app", abrir pelo ícone em tela cheia, conferir ícone, nome, fonte, cores e ilustração.
  2. iPhone (Safari): ver o aviso de instalação, adicionar à Tela de Início, abrir pelo ícone sem a barra do Safari e conferir o notch.
  3. Modo avião nos dois: o app abre.
  4. Publicar uma mudança trivial: aparece "Nova versão disponível" e "Atualizar" troca a versão do rodapé.

  Aguardar o OK do usuário antes da etapa 2.
  - **Validado (16/11/2026):** OK do usuário no Android e no iPhone para os quatro passos. A versão mudou de `a7dfc4f` para `cecc448` pelo "Atualizar".

## 2. Etapa 2 — Listas

- [x] 2.1 Criar `dominio/` de listas: entidade, validação de nome (trim, 1 a 60), mensagens, formatação (`R$ #.##0,00` fixo pt-BR, `dd/mm/aaaa`, resumo "nenhum item / c de 1 item / c de n itens", subtítulo, mensagem de exclusão, nome sugerido `Feira dd/mm`, cor do toldo por `id mod 4`) e classes de erro. Verificar: testes Vitest cobrindo cada cenário de `specs/listas` e os de formatação de `specs/tela-listas`, inclusive o aparelho em inglês.
- [x] 2.2 Criar `dados/` com o banco Dexie `version(1)` (`listas` e `itens`) e o repositório de listas: listar com qtd de itens, concluídos, total e previsto em centavos; inserir; renomear; excluir em transação com os itens. Erros do Dexie são envolvidos em `ErroArmazenamento` e 0 registros afetados viram `ErroNaoEncontrado`. Verificar: testes com `fake-indexeddb` para ordenação (data desc, id desc), cascade, totais e falha simulada sem alteração parcial.
- [x] 2.3 Criar o utilitário `executarOperacao`: toques bloqueados desde o início, indicador após 300 ms, uma operação por vez e erro → dialog "Atenção" ou "Ops!" (design, decisão 4). Verificar: testes com timers falsos para 299 ms (sem indicador) e 301 ms (com indicador), e duas chamadas seguidas executando uma vez só.
- [x] 2.4 Montar a tela de Listas: cards com faixa do toldo, nome com reticências, "data · resumo", total com "concluído" e "⋮"; subtítulo; botão "+"; estado vazio; estado de erro com "Tentar novamente"; rolagem até acima do "+". Verificar: testes de tela para estados vazio, com listas e erro de carregamento.
- [x] 2.5 Criar o modal Nova/Renomear lista (nome sugerido selecionado, teclado aberto, máx. 60, Salvar/Enter, Cancelar, toque fora não fecha) e o menu do card (painel inferior animado com Renomear, Excluir em vermelho e Cancelar, que fecha ao tocar fora), com a confirmação de exclusão nas três variações de mensagem. Verificar: testes de tela para validação mantendo o modal aberto com o texto, toque duplo em Salvar criando uma lista só e exclusão da última lista levando ao estado vazio.
- [x] 2.6 Criar os gestos do card: toque abre (provisoriamente o dialog "Em breve" de `tela-listas` atual), toque longo de 500 ms abre o menu, movimento acima de 10 px cancela. Ligar o voltar do Android à pilha de camadas (dialog → modal → menu). Pedir `navigator.storage.persist()` após a primeira lista gravada. Verificar: testes de tela simulando pointer events para toque, toque longo e arraste.
  - **Nota (16/11/2026):** a `PilhaCamadas` passou a adiar o `history.back()` para uma microtask. Se outra camada abre no mesmo toque (menu → modal, menu → dialog), ela reaproveita a entrada com `replaceState`, sem disputar o back assíncrono com um `pushState`.
- [x] 2.7 Conferir as telas lado a lado com `docs/mock-tela-listas.html` no `npm run dev` em largura 390 px e ajustar diferenças visuais. Verificar: `npm run lint`, `npm test` e `npm run build` passam e o workflow publica.
  - **Andamento (16/11/2026):** conferido no `npm run dev` a 390 px (cards, menu, modal, confirmação e rolagem com 17 listas); lint, 124 testes e build passam. Workflow verde e o site publicado com a versão `1d62bab` (16/11/2026).
- [x] 2.8 **Validação no celular — ponto de parada.** Rodar o "Roteiro sugerido" de `docs/mock-tela-listas.html` no app publicado, nos dois aparelhos. Incluir:
  - 15+ listas rolando a partir de cima de um card;
  - toque longo;
  - teclado virtual sobre o modal;
  - voltar do Android camada por camada;
  - fechar o app por completo e reabrir com as listas mantidas;
  - modo avião.

  Aguardar o OK do usuário antes da etapa 3.
  - **Validado (16/11/2026):** OK do usuário no celular para o roteiro da etapa, na versão `26.11.0`.

## 3. Etapa 3 — Detalhe e itens

- [ ] 3.1 Criar em `dominio/` as regras de itens:
  - validação de descrição (trim, 1 a 80), quantidade (inteiro 1 a 999) e valor (0 a 9.999.999 centavos);
  - subtotal e totais em centavos;
  - ordenação: pendentes por id, depois concluídos por id;
  - textos do rodapé e da confirmação de exclusão.

  Verificar: testes Vitest cobrindo cada cenário de `specs/itens` (exceto marcar) e os textos do rodapé de `specs/tela-detalhe-lista`.
- [ ] 3.2 Criar o repositório de itens: listar por lista na ordem, inserir (lista precisa existir → `ErroNaoEncontrado` de lista), editar mantendo `concluido` e `id`, excluir. Verificar: testes com `fake-indexeddb`, incluindo inserir em lista excluída e editar ou excluir item inexistente.
- [ ] 3.3 Montar a tela de Detalhe em `#/lista/:id`:
  - cabeçalho "‹", nome com reticências e "✎";
  - linhas dos itens (marcador ainda sem ação) e estado vazio;
  - rodapé fixo com total concluído, barra de progresso, resumo/previsto e "+ Adicionar item", com a área segura do iPhone;
  - estado de erro;
  - lista inexistente → aviso e volta para `#/`.

  Trocar o "Em breve" do card pela navegação ao detalhe. Verificar: testes de tela para lista com itens, vazia e inexistente.
- [ ] 3.4 Criar o componente `PainelInferior` e o painel Novo/Editar item: descrição (máx. 80, teclado aberto), stepper 1 a 999, valor com máscara de centavos e `inputmode="decimal"`, prévia do subtotal, Salvar/Cancelar, "Excluir item" na edição, toque fora não fecha, sobe junto com o teclado (`visualViewport`). Verificar: testes de tela para prévia do subtotal, limite do "–", validação mantendo os valores digitados e toque duplo em "Salvar item" criando um item só.
- [ ] 3.5 Criar o deslizar da linha para revelar "Excluir", a confirmação "Excluir item?", o "✎" reaproveitando o modal de renomear e o voltar (dialog → painel → modal → Listas). Tratar falhas e item inexistente conforme a spec. Verificar: testes de tela para exclusão pelos dois caminhos, cancelar exclusão e falha ao salvar mantendo o painel aberto.
- [ ] 3.6 Conferir o detalhe e o painel lado a lado com as telas 4 e 5 de `docs/mock-telas.html` e ajustar. Verificar: `npm run lint`, `npm test` e `npm run build` passam e o workflow publica.
- [ ] 3.7 **Validação no celular — ponto de parada.** Nos dois aparelhos:
  - criar uma lista e adicionar 10+ itens (teclado numérico, máscara do valor, painel acima do teclado);
  - editar um item;
  - excluir deslizando e pelo painel;
  - renomear pelo "✎";
  - voltar pelo "‹" e pelo Android, conferindo o card com "x de y itens" e o previsto;
  - recarregar a página no detalhe;
  - modo avião.

  Aguardar o OK do usuário antes da etapa 4.

## 4. Etapa 4 — Marcar concluído

- [ ] 4.1 Criar no repositório de itens a gravação só do campo `concluido` (item inexistente → `ErroNaoEncontrado`). Verificar: testes com `fake-indexeddb` para marcar, desmarcar voltando à posição de inclusão, item com R$ 0,00 e item inexistente.
- [ ] 4.2 Ligar o marcador na tela:
  - toque inverte a marcação e grava na hora, sem abrir o painel;
  - rótulo "Concluídos (N)";
  - subtotal cinza ou em destaque;
  - marcador verde `#2E9E22` com "✓";
  - rodapé e barra de progresso atualizados;
  - falha → "Ops!" com o marcador voltando ao estado anterior;
  - toques rápidos sem divergir do banco.

  Verificar: testes de tela para marcar, desmarcar, falha ao marcar e toque duplo.
- [ ] 4.3 Criar a animação FLIP do item mudando de grupo (~250 ms), respeitando `prefers-reduced-motion`. Verificar: no `npm run dev`, marcar e desmarcar mostra o item deslizando para a nova posição; com redução de movimento ativa no sistema, troca sem animação.
- [ ] 4.4 Conferir que a tela de Listas reflete os totais ao voltar do detalhe (cenário "Voltar do detalhe mostra os totais atualizados"). Verificar: teste de tela navegando Listas → Detalhe → marcar → voltar; `npm run lint`, `npm test` e `npm run build` passam e o workflow publica.
- [ ] 4.5 **Validação no celular — ponto de parada.** Simular uma feira real nos dois aparelhos:
  - lista com 15 itens, marcar e desmarcar em ordem aleatória;
  - conferir a animação, o total concluído, a barra de progresso e o previsto contra uma conta feita à mão;
  - item de R$ 0,00 concluído;
  - modo avião durante toda a simulação.

  Aguardar o OK do usuário antes da etapa 5.

## 5. Etapa 5 — Backup e encerramento

- [ ] 5.1 Criar o formato do backup (`{ app: 'feira-organizada', versao: 1, exportadoEm, listas: [...com itens] }`) e a validação dele no `dominio/`, reaproveitando as regras de listas e itens. Verificar: testes para backup válido, JSON inválido, `app` diferente, item com quantidade 0 e valor com fração de centavo.
- [ ] 5.2 Criar no `dados/` a exportação (lê tudo) e a importação (apaga e grava tudo numa única transação). Verificar: teste com `fake-indexeddb` fazendo exportar → importar → resultado idêntico, e falha simulada no meio da importação mantendo os dados anteriores.
- [ ] 5.3 Criar o botão de opções no cabeçalho de "Minhas Listas" com o menu "Exportar backup", "Importar backup" e "Cancelar". Detalhes:
  - a exportação usa o compartilhamento do sistema (Web Share com arquivo) quando disponível e, senão, o download de `feira-organizada-backup-AAAA-MM-DD.json`;
  - a importação usa `<input type="file">`, mostra a confirmação com N e M e trata arquivo inválido e falha;
  - sem listas, mostra o aviso.

  Verificar: testes de tela para exportar sem listas, importar arquivo inválido e importar com confirmação.
- [ ] 5.4 Atualizar a documentação:
  - `CLAUDE.md` e `README`: como rodar, testar e publicar, e a estrutura de pastas final;
  - no repositório Delphi (`Feira_Organizada`), um aviso no README apontando para este repositório como o produto atual.

  Verificar: `openspec validate migrar-para-pwa --strict` passa e os comandos documentados funcionam num clone limpo (`npm ci && npm test && npm run build`).
- [ ] 5.5 **Validação final no celular — ponto de parada.** Nos dois aparelhos:
  - exportar o backup e salvar ou compartilhar o arquivo;
  - excluir todas as listas;
  - importar o arquivo e conferir listas, itens, marcações e totais;
  - importar o arquivo do iPhone no Android e vice-versa;
  - tentar importar uma foto.

  Com o OK do usuário, a change fica pronta para arquivar.
