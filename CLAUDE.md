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
- **Comandos** (a partir da Etapa 1):
  - `npm run dev`: servidor de desenvolvimento;
  - `npm test`: testes;
  - `npm run lint`: lint;
  - `npm run build`: build de produção;
  - `npm run preview`: serve o build, útil para testar o service worker e o modo offline;
  - `npm run gerar-icones`: regera os ícones do PWA em `public/` a partir de `public/barraca.png` (config em `pwa-assets.config.ts`).
- **Publicação**: GitHub Actions publica no GitHub Pages a cada push na `main`. O `base` do Vite vem da variável `BASE_PATH`, com padrão `/`.

## Arquitetura

Decisões completas em `openspec/changes/migrar-para-pwa/design.md`.

- **Pastas** em `src/`:
  - `dominio/`: regras, validação, totais e formatação. Sem React e sem banco; tudo testável com Vitest.
  - `dados/`: banco IndexedDB (Dexie) e repositórios. Erros do banco viram `ErroArmazenamento`.
  - `telas/` e `componentes/`: React. As telas não acessam o Dexie direto.
  - `navegacao/`: rotas por hash (`#/`, `#/lista/:id`) e pilha de camadas (dialog, modal, menu, painel) ligada ao `history`, para o voltar do Android fechar uma camada por vez.
  - `estilo/`: tokens de cor e fonte, iguais aos dos mocks.
- **Dinheiro**: sempre em **centavos inteiros**. Formatação fixa em pt-BR (`R$ 1.234,56`), independente do idioma do aparelho.
- **Mensagens ao usuário**: só a partir de `src/dominio/mensagens.ts`, com os textos exatos das specs.
- **Schema do banco**: cada mudança é uma nova `db.version(n+1)`. Nunca edite uma versão já publicada, porque os usuários perderiam dados.
