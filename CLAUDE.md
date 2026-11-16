# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) a trabalhar neste repositório.

## Projeto

Feira Organizada PWA: app de listas de feira instalável na tela inicial do iPhone e do Android. Ele substitui o app Delphi FireMonkey, que fica congelado como referência no repositório irmão `C:\Projects_Sam\Feira_Organizada`. Código, identificadores, textos de tela e mensagens de commit são em **português do Brasil**.

O desenvolvimento é guiado pelo OpenSpec:
- a change ativa é `openspec/changes/migrar-para-pwa`, em 5 etapas;
- cada etapa termina publicada e validada no celular pelo usuário antes da próxima;
- toda spec nova passa por uma change do OpenSpec (proposal/specs/design/tasks), nunca por um `.md` solto em `docs/`.

Referências:
- `docs/PLANEJAMENTO.md`: regras e identidade visual do MVP;
- `docs/mock-telas.html` e `docs/mock-tela-listas.html`: desenho das telas;
- `img/`: ilustração original da barraca.

## Stack e comandos

- **Stack**: Vite + React + TypeScript, IndexedDB via Dexie, vite-plugin-pwa (Workbox), Vitest + Testing Library, ESLint. O projeto fica na raiz do repositório.
- **Comandos** (`npm ci` antes, com Node.js 24):
  - `npm run dev`: servidor de desenvolvimento;
  - `npm test`: testes;
  - `npm run lint`: lint;
  - `npm run build`: build de produção;
  - `npm run preview`: serve o build, útil para testar o service worker e o modo offline;
  - `npm run gerar-icones`: regera os ícones do PWA em `public/` a partir de `public/barraca.png` (config em `pwa-assets.config.ts`).
- **Publicação**: GitHub Actions publica no GitHub Pages a cada push na `main`. O `base` do Vite vem da variável `BASE_PATH`, com padrão `/`.
- **Versão**: formato `AA.M.n` (ano com 2 dígitos, mês e um número incremental que volta a 0 no mês seguinte), por exemplo `26.11.0`. Fica no `version` do `package.json` e aparece no rodapé de "Minhas Listas". Antes de publicar uma mudança, suba a versão com `npm version AA.M.n --no-git-tag-version`. O mês vai sem zero à esquerda (`27.1.0`), porque o npm não aceita `27.01.0`.

## Arquitetura

Decisões completas em `openspec/changes/migrar-para-pwa/design.md`.

- **Pastas** em `src/`:
  - `dominio/`: regras, validação, totais, formatação e o formato do backup (`backup.ts`). Sem React e sem banco; tudo testável com Vitest.
  - `dados/`: banco IndexedDB (Dexie) e repositórios de listas, itens e backup. Erros do banco viram `ErroArmazenamento`. A importação do backup apaga e grava tudo numa única transação.
  - `telas/` e `componentes/`: React. As telas não acessam o Dexie direto, só pelo `useRepositorios`.
  - `navegacao/`: rotas por hash (`#/`, `#/lista/:id`) e pilha de camadas (dialog, modal, menu, painel) ligada ao `history`, para o voltar do Android fechar uma camada por vez.
  - `pwa/`: oferta de instalação, pedido de armazenamento persistente e entrega de arquivos (Web Share com arquivo ou download).
  - `estilo/`: tokens de cor e fonte, iguais aos dos mocks.
  - `testes/`: setup do Vitest e banco de teste (`fake-indexeddb`).
- **Dinheiro**: sempre em **centavos inteiros**. Formatação fixa em pt-BR (`R$ 1.234,56`), independente do idioma do aparelho.
- **Mensagens ao usuário**: só a partir de `src/dominio/mensagens.ts`, com os textos exatos das specs.
- **Schema do banco**: cada mudança é uma nova `db.version(n+1)`. Nunca edite uma versão já publicada, porque os usuários perderiam dados.
- **Formato do backup**: `{ app: 'feira-organizada', versao: 1, exportadoEm, listas: [...com itens] }`, com os ids. Mudar o formato pede uma nova `versao` e a leitura das anteriores, porque os usuários guardam esses arquivos.
