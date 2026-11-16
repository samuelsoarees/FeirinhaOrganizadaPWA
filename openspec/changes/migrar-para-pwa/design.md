## Context

- O comportamento de listas já está especificado em `openspec/specs/listas` e `openspec/specs/tela-listas`, e foi implementado no Delphi. O visual está nos mocks `docs/mock-telas.html` e `docs/mock-tela-listas.html`, e os tokens de cor e fonte em `docs/PLANEJAMENTO.md` (seção 2).
- O PWA nasce do zero num repositório próprio (`Feira_Organizada_PWA`), com o projeto na raiz. O código Delphi não é reaproveitado; servem de referência as regras, as mensagens e a separação em camadas (entidade → regra → acesso a dados → tela).
- Restrições:
  - hospedagem estática (GitHub Pages) num subcaminho com o nome do repositório no GitHub (`/FeirinhaOrganizadaPWA/`);
  - repositório público no GitHub, condição para o GitHub Pages gratuito;
  - no iPhone não existe prompt de instalação, e o Safari pode apagar dados de sites não instalados após 7 dias sem uso;
  - o desenvolvimento acontece em Windows com Node 24.
- Motivação e escopo: ver `proposal.md`. Requisitos: specs desta change (`app-pwa`, `itens`, `tela-detalhe-lista`, `backup-dados`, delta de `tela-listas`) e `listas`, que vale sem alteração.

## Goals / Non-Goals

**Goals:**
- Cada etapa sai publicada e instalável, para ser validada no celular antes da próxima.
- Regras de negócio isoladas da interface e cobertas por testes automatizados (Vitest), que o Delphi não tinha.
- Funcionar 100% offline e sem backend.
- Visual fiel aos mocks: as classes e medidas dos mocks são o ponto de partida do CSS.

**Non-Goals:**
- Login, Firebase, sincronização entre aparelhos.
- Suporte a navegadores antigos: o alvo é Safari iOS 16.4+ e Chrome Android dos últimos dois anos.
- Internacionalização: textos fixos em pt-BR.
- Remover ou alterar o código Delphi, que fica no repositório `Feira_Organizada`.

## Decisions

### 1. Stack: Vite + React + TypeScript
- **Por quê**: o React é o ecossistema com mais material, e os componentes do mock (card, modal, painel, dialog) viram componentes com estado local. O TypeScript dá tipagem das entidades, perto do que o Delphi oferecia. O Vite tem build rápido e integração com o plugin de PWA.
- **Alternativas**:
  - JavaScript puro sem framework: menos dependências, mas o estado e a re-renderização da lista ficam manuais.
  - Svelte: bundle menor, comunidade menor.
  - Angular: pesado para 2 telas.
  - Ionic e Capacitor: só valem se um dia formos para as lojas.

### 2. Estrutura de pastas espelhando as camadas do Delphi

```
(raiz do repositório)
  src/
    dominio/      # entidades, regras, validação, totais, formatação, mensagens (sem React, sem banco)
    dados/        # banco IndexedDB (Dexie): schema, repositórios de lista e item, backup
    telas/        # Listas, DetalheLista
    componentes/  # Dialog, Modal, PainelInferior (bottom sheet), Carregando, AvisoInstalacao, AvisoAtualizacao
    navegacao/    # rotas em hash e pilha de camadas para o voltar
    estilo/       # tokens.css (cores, fonte, raios) e estilos base
  public/         # ícones, ilustração, fontes
  tests/          # ou *.test.ts ao lado dos arquivos
```

O fluxo é: telas → `dominio` (regras) → `dados` (repositórios). As telas não acessam o Dexie direto. É o mesmo princípio de View → Model → DAO do Delphi, sem a cerimônia de interfaces com GUID.

### 3. Banco: IndexedDB com Dexie, valores em centavos
- **Tabelas**:
  - `listas`: `++id, dataCriacao`, com os campos `nome` e `dataCriacao` (ISO 8601);
  - `itens`: `++id, idLista, [idLista+concluido]`, com os campos `descricao`, `unidade`, `quantidade` (inteiro), `valorUnitarioCentavos` (inteiro) e `concluido` (0/1).
- **Dinheiro em centavos inteiros**: resolve o requisito de "exato em centavos" sem biblioteca decimal. Formatação só na borda: `centavos / 100` com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` fixo em pt-BR, independente do idioma do aparelho.
- **Ordenação**:
  - listas: `dataCriacao` desc, `id` desc;
  - itens: `concluido` asc, `id` asc. O `id` autoincremento é a "ordem de inclusão" e não muda ao marcar ou editar.
- **Excluir lista**: apaga a lista e os itens dela numa transação `rw` (`listas`, `itens`), que é o equivalente ao `ON DELETE CASCADE`. Importar backup também usa uma única transação.
- **Versões do schema**: `db.version(n).stores(...)` com `.upgrade()` são as "migrations" do PWA. Uma versão publicada nunca é editada; mudança de schema sempre cria `version(n+1)`. É a mesma regra das migrations M4D.
- **Alternativas**:
  - `localStorage`: síncrono, limite de 5 MB e sem transação.
  - SQLite em WASM com OPFS: mais próximo do Delphi, mas pesado (~1 MB) e com suporte inconsistente no Safari.
  - IndexedDB "cru": API verbosa.

### 4. Erros e mensagens
- `dominio/mensagens.ts` concentra todas as strings das specs, no papel do `u*Messages`.
- Classes de erro:
  - `ErroValidacao(mensagem)`: a tela mostra "Atenção" com a mensagem;
  - `ErroNaoEncontrado(mensagem)`: lista ou item que deixou de existir; a tela mostra "Atenção" e recarrega;
  - `ErroArmazenamento(operacao)`: os repositórios envolvem toda exceção do Dexie nela; a tela mostra "Ops!" com a mensagem genérica da operação e nunca o texto técnico.
- Um utilitário `executarOperacao(fn, { mensagemFalha })` centraliza nas telas: bloqueio de toques, indicador após 300 ms, uma operação por vez e o mapeamento erro → dialog. É o equivalente ao `TMobileThreading` + `ExibirErro`.

### 5. Navegação por hash e pilha de camadas para o voltar
- **Rotas**: `#/` (Listas) e `#/lista/:id` (Detalhe). Hash porque o GitHub Pages não faz rewrite de SPA; com rotas por caminho, o recarregamento no detalhe daria 404. Com só duas rotas, um roteador próprio de ~40 linhas evita a dependência do react-router.
- **Voltar**: cada camada aberta (dialog, modal, menu, painel) faz `history.pushState` e se registra numa pilha. O `popstate` fecha só a camada do topo, cumprindo "uma camada por toque". Fechar pelo botão da própria camada faz `history.back()`. Com carregamento em andamento, o `popstate` é revertido com um novo `pushState`.
- **Sem nada aberto**: no Detalhe, o voltar é a própria navegação de hash, que volta para `#/`. Em Listas, o histórico chega ao início e o Android encerra o PWA instalado.

### 6. PWA: vite-plugin-pwa (Workbox) com atualização por aviso
- `registerType: 'prompt'`: o service worker novo fica esperando, o app mostra "Nova versão disponível" e "Atualizar" chama `updateSW(true)`. Isso evita recarregar sozinho no meio de uma edição.
- O precache de todo o build (JS, CSS, fontes, ícones, ilustração) garante o funcionamento offline.
- Manifest:
  - nome `Feira Organizada`, nome curto `Feira`;
  - `display: standalone`;
  - `theme_color` e `background_color` `#181F3D`;
  - `start_url` e `scope` relativos (`./`) por causa do subcaminho do GitHub Pages;
  - ícones 192, 512 e maskable 512.
- iOS: `apple-touch-icon` 180 e as metas `apple-mobile-web-app-*` no `index.html`.
- Ícones gerados por `@vite-pwa/assets-generator` a partir da ilustração da barraca sobre o fundo `#181F3D`, com margem para a máscara do Android. A ilustração é copiada de `img/oie_transparent (1).png` para `public/` com o nome `barraca.png`, sem espaços.

### 7. Instalação e armazenamento persistente
- **Android**: captura `beforeinstallprompt` e mostra "Instalar app" no cabeçalho de Listas, que chama `prompt()`.
- **iPhone**: detecta o Safari iOS (user agent) fora do modo standalone (`navigator.standalone` / `matchMedia('(display-mode: standalone)')`) e mostra o aviso de instalação. "Agora não" grava a dispensa em `localStorage`.
- **Armazenamento persistente**: `navigator.storage.persist()` é chamado depois da primeira lista gravada, com falha ignorada silenciosamente.

### 8. Visual e interação
- **Tokens** em `estilo/tokens.css`, com as cores do PLANEJAMENTO (fundo, superfície, borda, primária, verde `#2E9E22`, toldo).
- **Fonte**: Nunito servida localmente via `@fontsource/nunito`, nos pesos 400, 700 e 800, para funcionar offline. O `OFL.txt` acompanha a fonte.
- **Animações** em CSS: painel e menu subindo, dialog. O item mudando de grupo usa animação de layout FLIP em ~250 ms; o `useLayoutEffect` mede a posição antes e depois e aplica `transform`.
- **Gestos**: Pointer Events nos dois componentes que precisam deles.
  - Card: toque longo de 500 ms; um movimento acima de 10 px cancela toque e toque longo, para a rolagem não abrir a lista.
  - Linha do item: deslizar à esquerda revela "Excluir".
- **Campo de valor**: `inputmode="decimal"` com máscara que trata os dígitos como centavos (digitar `075` resulta em `R$ 0,75`), padrão de app bancário. Isso evita o problema de vírgula e ponto no teclado.
- **Teclado do iPhone**: o painel inferior usa `visualViewport` para subir junto com o teclado.
- **Área segura**: `env(safe-area-inset-*)` no cabeçalho e no rodapé, por causa do notch e da barra de gestos do iPhone.

### 9. Testes e qualidade
- Vitest.
  - `dominio/`: testes unitários cobrindo cada cenário das specs `listas` e `itens` (validação, totais, ordenação, formatação, textos de plural).
  - `dados/`: testes com `fake-indexeddb` (cascade, transação de importação, ordenação vinda do banco).
  - Telas: testes de fluxo com Testing Library para os cenários de maior risco (validação mantendo o modal aberto, uma operação por vez, falha de armazenamento → "Ops!").
- ESLint (typescript-eslint + plugin de hooks) e `tsc --noEmit` no build.
- Scripts no `package.json`: `dev`, `build`, `preview`, `test`, `lint`.

### 10. Publicação: GitHub Actions → GitHub Pages
- Workflow `.github/workflows/pwa.yml`:
  - roda em push na branch `main` e também por `workflow_dispatch`;
  - passos: `npm ci`, `npm run lint`, `npm test`, `npm run build` com o `base` vindo da variável `BASE_PATH`, preenchida pelo `actions/configure-pages` com o subcaminho do repositório (em desenvolvimento local o `base` é `/`);
  - publica o `dist` com `actions/upload-pages-artifact` + `actions/deploy-pages`.
- Cada etapa validada chega na `main` e é publicada. Trabalho em andamento fica em branches de etapa, que não publicam.
- Endereço: `https://samuelsoarees.github.io/FeirinhaOrganizadaPWA/` (repositório `samuelsoarees/FeirinhaOrganizadaPWA`; a pasta local continua `Feira_Organizada_PWA`).

### 11. Etapas
Cada grupo de `tasks.md` é uma etapa que termina publicada, com um roteiro de validação no celular e um **ponto de parada**: a etapa seguinte só começa depois da validação do usuário.

| Etapa | Entrega | Specs cobertas |
| --- | --- | --- |
| 1 | Base instalável e publicada | `app-pwa` (instalação, offline, nova versão, endereço) |
| 2 | Listas | `listas`, `tela-listas` e o armazenamento persistente de `app-pwa`. O toque no card mostra "Em breve" provisório até a etapa 3 |
| 3 | Detalhe e itens | `itens` (sem marcar) e `tela-detalhe-lista` (sem marcar); o card passa a abrir o detalhe |
| 4 | Marcar concluído | Marcação, ordenação animada e totais em `itens` e `tela-detalhe-lista` |
| 5 | Backup e encerramento | `backup-dados`, documentação, gatilho de publicação |

## Risks / Trade-offs

- **[GitHub Pages gratuito exige repositório público]** → O PWA tem repositório próprio, criado público, sem o histórico do Delphi (onde está a chave do Firebase). Se um dia precisar ser privado, a troca para Cloudflare Pages ou Netlify muda só o workflow de publicação.
- **[iPhone pode apagar os dados de site não instalado]** → Aviso de instalação no Safari, pedido de armazenamento persistente e backup por arquivo (etapa 5).
- **[Usuário troca de aparelho ou limpa os dados do navegador e perde as listas]** → O backup por arquivo é a mitigação no MVP; a sincronização na nuvem fica para depois do MVP.
- **[O app Delphi e o PWA divergirem nas specs]** → O Delphi está congelado. As specs deste repositório descrevem só o PWA, e o `CLAUDE.md` deixa isso explícito.
- **[Gestos (toque longo, deslizar) se comportam diferente no Safari e no Chrome]** → Implementar com Pointer Events e `touch-action` adequado, e validar nos dois aparelhos em cada etapa que introduz gesto (etapas 2 e 3).
- **[Service worker preso numa versão antiga durante a validação]** → O aviso "Nova versão disponível" já vem na etapa 1. O roteiro de validação inclui conferir a versão exibida no rodapé da tela de Listas. A versão segue `AA.M.n` (ano, mês e um número incremental, ex.: `26.11.0`), vem do `version` do `package.json` e sobe a cada publicação.
- **[Site público na internet]** → Não há dados no servidor, então o risco é só de exposição do app em si. Nada de chaves ou segredos no código do PWA.

## Migration Plan

- **Implantação**: cada etapa é publicada pelo workflow ao chegar na `main`.
- **Rollback**: reverter o commit na `main`, o que dispara a republicação, ou rodar o workflow manualmente num commit anterior. Os dados do usuário não são afetados por rollback de código, desde que nenhuma versão de schema publicada seja editada (decisão 3).
- **Mudança de schema**: sempre por uma nova `version(n+1)` com `upgrade`.
- **Fim do MVP**: o README descreve o PWA como produto, e o repositório Delphi ganha um aviso apontando para cá.

## Open Questions

- **Domínio próprio**: dá para apontar um domínio próprio para o GitHub Pages depois, sem mudar nada além do `base` do Vite e do manifest.
- **Ícone**: usar a ilustração da barraca inteira ou um recorte só do toldo? O formato final pode ser ajustado na validação da etapa 1 sem impacto no restante.
