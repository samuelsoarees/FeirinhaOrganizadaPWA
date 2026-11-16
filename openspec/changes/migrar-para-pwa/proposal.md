## Why

Publicar o app Delphi FireMonkey no iPhone e no Android exige SDKs, certificados e as lojas (App Store e Play Store), o que trava a validação do MVP com usuários reais. Um PWA publicado num endereço HTTPS é instalado na tela inicial direto pelo navegador nos dois sistemas. As telas já desenhadas em HTML (`docs/mock-telas.html`, `docs/mock-tela-listas.html`) servem quase direto de base. Por isso o PWA **substitui** o app Delphi como produto. Ele é construído num repositório próprio (`Feira_Organizada_PWA`), separado do Delphi, em etapas, cada uma publicada e validada no celular antes da próxima.

## What Changes

- Novo **PWA**, na raiz deste repositório, com o MVP de listas de feira completo, com o visual dos mocks: cores do app, fonte Nunito e ilustração da barraca.
- **Instalável e offline**: ícone na tela inicial, abre em tela cheia, funciona sem internet depois da primeira abertura, avisa quando há versão nova. No iPhone mostra como instalar pelo Safari.
- **Dados só no aparelho** (banco do navegador), com pedido de armazenamento persistente e **backup** por arquivo (exportar e importar), para o usuário não perder as listas.
- **Tela de Listas** com o mesmo comportamento já especificado em `tela-listas`. Muda o toque no card, que agora abre o detalhe, e o indicador de carregamento passa a aparecer só em operações demoradas.
- **Tela de Detalhe da lista**: itens com marcador de concluído, pendentes em cima e concluídos no fim, rodapé com total concluído, progresso e previsto. Cadastro, edição e exclusão de item por um painel que sobe de baixo.
- **Regras de itens**: validação de descrição, quantidade e valor; total só dos concluídos.
- **Publicação contínua** no GitHub Pages a cada etapa, com roteiro de validação no celular.
- Desenvolvimento em **5 etapas** validáveis (detalhe em `tasks.md`):
  1. base instalável e publicada;
  2. listas;
  3. detalhe e itens;
  4. marcar concluído;
  5. backup.
- **BREAKING (produto)**: o app Delphi deixa de ser o produto. O código continua no repositório `Feira_Organizada` como referência, sem novas funcionalidades.

### Premissas assumidas (ajustáveis na revisão)

- Stack do PWA: Vite + React + TypeScript (ver `design.md`).
- Limites dos campos do item: descrição até 80 caracteres (mesmo tamanho da coluna do banco Delphi), quantidade inteira de 1 a 999 e valor unitário de R$ 0,00 a R$ 99.999,99.
- Importar um backup **substitui** todas as listas do aparelho (não mescla).
- Não há migração de dados do app Delphi, que nunca foi distribuído.

## Capabilities

### New Capabilities
- `app-pwa`: instalação na tela inicial (Android e iPhone), funcionamento offline, dados guardados só no aparelho, armazenamento persistente e aviso de nova versão.
- `itens`: regras de negócio dos itens de uma lista: criar, validar, editar, excluir, marcar e desmarcar concluído, ordenação e totais.
- `tela-detalhe-lista`: tela de detalhe de uma lista. Cobre:
  - estados (carregando, com itens, vazio, erro);
  - linha do item, marcador de concluído e rodapé com totais;
  - painel de cadastro e edição de item;
  - exclusão com confirmação;
  - renomear a lista;
  - voltar e tratamento de erros.
- `backup-dados`: exportar todas as listas e itens para um arquivo e importar um backup, substituindo os dados do aparelho.

### Modified Capabilities
- `tela-listas`: o toque no card passa a abrir a tela de Detalhe (sai o dialog "Em breve"). O indicador de carregamento passa a aparecer só quando a operação demora, mas os toques continuam bloqueados desde o início. O botão voltar do Android passa a valer também para o PWA instalado.

## Impact

- **Código novo**: projeto Node na raiz deste repositório, com:
  - dependências: Vite, React, TypeScript, Dexie (IndexedDB), vite-plugin-pwa, fonte Nunito local, Vitest e ESLint;
  - assets: ilustração e ícones gerados a partir de `img/oie_transparent (1).png`.
- **CI/CD**: novo workflow `.github/workflows/pwa.yml`, que roda build e testes e publica no GitHub Pages. **Pré-requisito**: o repositório no GitHub é público, condição para o GitHub Pages gratuito. O site publicado é público, mas os dados ficam só no aparelho de cada usuário.
- **Delphi** (repositório `Feira_Organizada`): nenhuma alteração; fica congelado.
- **Documentação**: este repositório nasce com `CLAUDE.md`, `openspec/config.yaml` e as specs `listas` e `tela-listas` trazidos do repositório Delphi, junto com os mocks e o planejamento em `docs/`.
- Fora do escopo:
  - login, Firebase e sincronização na nuvem;
  - itens por peso (KG);
  - publicação nas lojas (TWA/Capacitor);
  - remoção do código Delphi.
