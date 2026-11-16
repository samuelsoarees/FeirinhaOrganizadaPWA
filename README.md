# Feira Organizada

App de listas de feira instalável na tela inicial do iPhone e do Android. Você cria listas, lança os itens com quantidade e valor, marca o que já pegou e acompanha o total da compra.

- **Endereço:** https://samuelsoarees.github.io/FeirinhaOrganizadaPWA/
- **Sem login e sem servidor:** as listas ficam só no aparelho, no IndexedDB do navegador.
- **Funciona offline** depois da primeira abertura.
- **Backup:** em "Minhas Listas", o botão ⋮ exporta todas as listas para um arquivo `.json` e importa esse arquivo de volta, no mesmo aparelho ou em outro.

Este app substitui o antigo app Delphi FireMonkey (repositório `Feira_Organizada`), que fica congelado só como referência.

## Instalar no celular

- **Android (Chrome):** abra o endereço e toque em "Instalar app" no topo da tela.
- **iPhone (Safari):** abra o endereço, toque em Compartilhar e depois em "Adicionar à Tela de Início". No iPhone, as listas ficam mais protegidas com o app instalado.

## Desenvolvimento

Requer Node.js 24.

```bash
npm ci
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes (Vitest + Testing Library, banco com `fake-indexeddb`) |
| `npm run lint` | ESLint |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o build, útil para testar o service worker e o modo offline |
| `npm run gerar-icones` | regera os ícones do PWA em `public/` a partir de `public/barraca.png` |

O `base` do Vite vem da variável `BASE_PATH`, com padrão `/`.

## Publicação

O workflow `.github/workflows/pwa.yml` roda lint, testes e build e publica no GitHub Pages a cada push na `main` (ou manualmente, por `workflow_dispatch`). O `BASE_PATH` do Pages vem do `actions/configure-pages`.

Antes de publicar, suba a versão no formato `AA.M.n` (ano com 2 dígitos, mês sem zero à esquerda e um número que volta a 0 no mês seguinte):

```bash
npm version 26.11.3 --no-git-tag-version
```

A versão aparece no rodapé de "Minhas Listas". Quem já tem o app aberto vê "Nova versão disponível" e toca em "Atualizar".

## Estrutura

```
src/
  dominio/      regras, validação, totais, formatação, backup e todas as mensagens (sem React e sem banco)
  dados/        banco IndexedDB (Dexie) e repositórios de listas, itens e backup
  telas/        telas "Minhas Listas" e detalhe da lista
  componentes/  dialog, modal, menu e painel inferior, indicador de carregamento, provedores
  navegacao/    rotas por hash (#/ e #/lista/:id) e pilha de camadas ligada ao voltar do Android
  pwa/          instalação, armazenamento persistente e entrega de arquivos (compartilhar/baixar)
  estilo/       tokens de cor e fonte
  testes/       apoio aos testes (banco de teste, setup)
docs/           planejamento do MVP e mocks das telas
openspec/       specs e changes (OpenSpec)
public/         ícones, ilustração e fontes servidas como estão
```

Dinheiro é sempre guardado em centavos inteiros e formatado em pt-BR (`R$ 1.234,56`), independente do idioma do aparelho.

O desenvolvimento é guiado pelo OpenSpec: toda mudança de comportamento passa por uma change em `openspec/changes/`.
