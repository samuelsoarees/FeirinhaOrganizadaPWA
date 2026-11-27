# tela-detalhe-lista Specification

## Purpose
Tela onde o usuário vê e gerencia os itens de uma lista de feira durante a compra. Nela o usuário lança itens, marca o que já comprou e acompanha o total concluído, o progresso e o valor previsto.

## Requirements

### Requirement: Exibir o cabeçalho da lista
A tela SHALL mostrar no topo o botão voltar "‹", o nome da lista, o botão "✎" para renomear e o botão "⋯" para as opções da lista. Nomes que não couberem em uma linha MUST terminar em reticências. Enquanto a lista não foi carregada, os botões "✎" e "⋯" MUST ficar escondidos.

#### Scenario: Abrir a lista
- **WHEN** o usuário abre a lista "Feira do sábado"
- **THEN** o cabeçalho mostra "‹", "Feira do sábado", "✎" e "⋯"

#### Scenario: Lista ainda carregando
- **WHEN** os itens da lista ainda estão sendo lidos
- **THEN** o cabeçalho mostra "‹" sem os botões "✎" e "⋯"

### Requirement: Exibir os itens agrupados por situação
A tela SHALL exibir uma linha por item, primeiro os pendentes e depois os concluídos, na ordem definida pelas regras de itens. Os concluídos ficam abaixo do rótulo "Concluídos (N)", que só aparece quando há ao menos um item concluído. Cada linha MUST mostrar:
- o marcador de concluído;
- a descrição, terminada em reticências se não couber;
- o texto `qtd UN × R$ unitário`;
- o subtotal à direita: cinza quando o item está pendente, em destaque quando está concluído.

O marcador do item concluído é verde e mostra "✓".

#### Scenario: Linha de item pendente
- **WHEN** a lista tem o item pendente "Pimentão", 3 UN × R$ 2,00
- **THEN** a linha mostra o marcador vazio, "Pimentão", "3 UN × R$ 2,00" e "R$ 6,00" em cinza

#### Scenario: Linha de item concluído
- **WHEN** a lista tem o item concluído "Tomate", 6 UN × R$ 1,20
- **THEN** a linha aparece abaixo de "Concluídos (N)" com o marcador verde com "✓", "Tomate", "6 UN × R$ 1,20" e "R$ 7,20" em destaque

#### Scenario: Nenhum item concluído
- **WHEN** todos os itens da lista estão pendentes
- **THEN** o rótulo "Concluídos" não aparece

#### Scenario: Muitos itens
- **WHEN** existem mais itens do que cabem na tela
- **THEN** a área dos itens rola na vertical e o último item pode ser rolado até ficar acima do rodapé

### Requirement: Exibir estado vazio da lista
Quando a lista não tiver itens, a tela SHALL mostrar o texto "Nenhum item ainda. Toque em + para adicionar." no lugar dos itens, mantendo o rodapé com o botão "+ Adicionar item".

#### Scenario: Lista nova
- **WHEN** o usuário abre uma lista recém-criada
- **THEN** a tela mostra "Nenhum item ainda. Toque em + para adicionar." e o rodapé com "R$ 0,00"

### Requirement: Exibir o rodapé com os totais
A tela SHALL manter fixo na parte de baixo um rodapé com:
- "Total concluído" e o valor do total concluído em destaque;
- uma barra de progresso proporcional aos itens concluídos sobre o total de itens;
- uma linha de resumo;
- o botão "+ Adicionar item".

A linha de resumo segue o formato "c de n itens concluídos · previsto R$ X", com "c de 1 item concluído · previsto R$ X" quando há um item e "nenhum item · previsto R$ 0,00" quando não há itens. Os valores MUST seguir o formato `R$ #.##0,00` independentemente do idioma do aparelho. O rodapé MUST se atualizar sempre que um item for incluído, alterado, excluído, marcado ou desmarcado.

#### Scenario: Rodapé com itens
- **WHEN** a lista tem 6 itens, 4 concluídos somando R$ 37,40 e previsto R$ 51,40
- **THEN** o rodapé mostra "R$ 37,40", a barra de progresso em 4/6 e "4 de 6 itens concluídos · previsto R$ 51,40"

#### Scenario: Rodapé com um item
- **WHEN** a lista tem 1 item pendente de R$ 3,75
- **THEN** o rodapé mostra "R$ 0,00" e "0 de 1 item concluído · previsto R$ 3,75"

### Requirement: Marcar e desmarcar item pela tela
Tocar no marcador de um item SHALL inverter a sua marcação de concluído, gravando na hora, sem abrir o painel de edição. Ao marcar, o item MUST ir com animação para o grupo de concluídos. Ao desmarcar, MUST voltar com animação para a sua posição entre os pendentes. O rodapé e o rótulo "Concluídos (N)" se atualizam em seguida.

#### Scenario: Marcar item
- **WHEN** o usuário toca no marcador do item pendente "Pimentão", de R$ 6,00, numa lista com total concluído R$ 37,40
- **THEN** "Pimentão" desce para o grupo de concluídos com o marcador verde, o rótulo passa a "Concluídos (5)" e o total concluído passa a R$ 43,40

#### Scenario: Desmarcar item
- **WHEN** o usuário toca no marcador do item concluído "Tomate"
- **THEN** "Tomate" volta para os pendentes na sua posição de inclusão, com o subtotal em cinza, e o total concluído diminui o subtotal dele

#### Scenario: Toques rápidos no mesmo marcador
- **WHEN** o usuário toca duas vezes rápido no marcador de um item pendente
- **THEN** o item termina com a mesma marcação gravada no banco que aparece na tela

### Requirement: Cadastrar item pelo painel
O botão "+ Adicionar item" SHALL abrir um painel que sobe da parte de baixo da tela com:
- o título "Novo item";
- o campo "Descrição", vazio, com o teclado aberto e no máximo 80 caracteres;
- o seletor "Quantidade (UN)", com os botões "–" e "+", começando em 1 e limitado a 1 e 999;
- o campo "Valor unitário", com teclado numérico e máscara `R$ 0,00`, começando em R$ 0,00;
- a prévia "Subtotal", atualizada enquanto o usuário digita;
- os botões "Salvar item" e "Cancelar".

"Salvar item" grava, fecha o painel e mostra o item entre os pendentes. "Cancelar" fecha sem gravar. Tocar fora do painel MUST NOT fechá-lo.

#### Scenario: Cadastrar item
- **WHEN** o usuário toca em "+ Adicionar item", digita "Banana prata", ajusta a quantidade para 5, digita o valor 0,75 e toca em "Salvar item"
- **THEN** o painel fecha, "Banana prata · 5 UN × R$ 0,75 · R$ 3,75" aparece como último pendente e o previsto soma R$ 3,75

#### Scenario: Prévia do subtotal
- **WHEN** no painel a quantidade é 5 e o usuário digita o valor unitário 0,75
- **THEN** a prévia mostra "Subtotal R$ 3,75"

#### Scenario: Limite da quantidade
- **WHEN** a quantidade está em 1 e o usuário toca em "–"
- **THEN** a quantidade continua 1

#### Scenario: Cancelar
- **WHEN** o usuário abre o painel, digita "Alho" e toca em "Cancelar"
- **THEN** o painel fecha e nenhum item é criado

### Requirement: Editar item pelo painel
Tocar em qualquer parte da linha do item, fora do marcador, SHALL abrir o mesmo painel com o título "Editar item", os dados atuais do item preenchidos e o botão adicional "Excluir item". Salvar MUST manter a marcação de concluído do item.

#### Scenario: Editar quantidade
- **WHEN** o usuário toca na linha "Tomate", muda a quantidade de 6 para 8 e toca em "Salvar item"
- **THEN** o painel fecha e a linha mostra "8 UN × R$ 1,20" e "R$ 9,60", no mesmo grupo de antes

### Requirement: Excluir item com confirmação
O item SHALL poder ser excluído de duas formas:
- deslizando a linha para a esquerda, o que revela o botão "Excluir";
- pelo botão "Excluir item" do painel de edição.

Nos dois casos MUST aparecer o dialog de alerta "Excluir item?" com a mensagem "“<descrição>” será excluído. Essa ação não pode ser desfeita." e os botões "Excluir" e "Cancelar". Deslizar a linha de volta ou tocar em outro lugar esconde o botão "Excluir" revelado.

#### Scenario: Excluir deslizando
- **WHEN** o usuário desliza a linha "Pimentão" para a esquerda, toca em "Excluir" e confirma no dialog
- **THEN** a linha some e o rodapé é recalculado sem "Pimentão"

#### Scenario: Excluir pelo painel
- **WHEN** o usuário abre a edição de "Alface americana", toca em "Excluir item" e confirma
- **THEN** o painel fecha e o item some da tela

#### Scenario: Cancelar a exclusão
- **WHEN** o usuário toca em "Cancelar" no dialog "Excluir item?"
- **THEN** o dialog fecha e o item continua na tela

### Requirement: Renomear a lista pelo detalhe
O botão "✎" SHALL abrir o modal "Renomear lista", o mesmo da tela de Listas, com o nome atual preenchido e selecionado. Ao salvar, o cabeçalho MUST mostrar o novo nome.

#### Scenario: Renomear pelo detalhe
- **WHEN** o usuário toca em "✎", digita "Feira de domingo" e salva
- **THEN** o modal fecha e o cabeçalho mostra "Feira de domingo"

### Requirement: Mostrar erro de validação do item sem perder o que foi digitado
Quando a gravação do item for recusada por validação, a tela SHALL mostrar o dialog de aviso "Atenção" com a mensagem da regra. O painel MUST continuar aberto com os valores digitados.

#### Scenario: Salvar sem descrição
- **WHEN** o usuário deixa a descrição vazia, ajusta a quantidade para 3 e toca em "Salvar item"
- **THEN** aparece o dialog "Atenção" com "Informe a descrição do item." e, ao fechá-lo, o painel continua aberto com a quantidade 3

### Requirement: Voltar para a tela de Listas
O botão "‹" SHALL voltar para a tela de Listas. O botão ou gesto voltar do Android SHALL fechar uma camada por toque, nesta ordem: o dialog aberto, o menu "Opções da lista", o painel do item, o modal de renomear. Sem nada aberto, MUST voltar para a tela de Listas. Com o carregamento em andamento, o voltar MUST ser ignorado.

#### Scenario: Voltar pelo "‹"
- **WHEN** o usuário toca em "‹"
- **THEN** a tela de Listas aparece com os cards atualizados

#### Scenario: Voltar do Android com o painel aberto
- **WHEN** o painel "Novo item" está aberto e o usuário toca em voltar
- **THEN** o painel fecha sem gravar e o app continua no detalhe da lista

#### Scenario: Voltar do Android com o menu de opções aberto
- **WHEN** o menu "Opções da lista" está aberto e o usuário toca em voltar
- **THEN** o menu fecha sem alterar nada e o app continua no detalhe da lista

### Requirement: Indicar carregamento no detalhe
Enquanto os itens são lidos, um item é gravado, marcado ou excluído, ou os itens são desmarcados ou têm os preços zerados, a tela MUST ignorar novos pedidos de leitura, gravação ou exclusão desde o início da operação. O indicador de carregamento SHALL aparecer quando a operação passar de 300 ms.

#### Scenario: Toque duplo em Salvar item
- **WHEN** o usuário toca duas vezes seguidas e rápido em "Salvar item"
- **THEN** apenas um item é criado

#### Scenario: Toque no marcador durante zerar preços
- **WHEN** os preços estão sendo zerados e o usuário toca no marcador de um item
- **THEN** o toque é ignorado e o item mantém a marcação

### Requirement: Tratar falhas no detalhe
Se o banco falhar, a tela SHALL mostrar o dialog "Ops!" com a mensagem da operação e MUST NOT mostrar o texto técnico do banco:

| Operação | Mensagem | Estado depois da falha |
| --- | --- | --- |
| Carregar | "Não foi possível carregar os itens. Tente novamente." | Estado de erro com o botão "Tentar novamente" |
| Salvar | "Não foi possível salvar o item. Tente novamente." | O painel continua aberto com os valores digitados |
| Excluir | "Não foi possível excluir o item. Tente novamente." | O item continua na tela |
| Marcar | "Não foi possível marcar o item. Tente novamente." | O marcador volta ao estado anterior |

#### Scenario: Falha ao marcar
- **WHEN** o usuário toca no marcador de um item e o banco falha
- **THEN** aparece "Não foi possível marcar o item. Tente novamente." e o item continua pendente, no mesmo lugar

#### Scenario: Falha ao carregar
- **WHEN** o banco falha ao ler os itens da lista
- **THEN** aparece o dialog "Ops!" e, por baixo, o estado de erro com "Tentar novamente"

### Requirement: Tratar lista ou item que deixou de existir
Se a lista aberta não existir mais, a tela SHALL mostrar o dialog "Atenção" com "Esta lista não existe mais. Atualizamos a tela para você." e voltar para a tela de Listas. Isso vale ao abrir por um endereço antigo, ao gravar um item, ao desmarcar todos e ao zerar os preços. Se um item editado, marcado ou excluído não existir mais, a tela SHALL mostrar "Este item não existe mais. Atualizamos a tela para você.", fechar o painel e recarregar os itens.

#### Scenario: Endereço de lista excluída
- **WHEN** o usuário abre pelo endereço o detalhe de uma lista que já foi excluída
- **THEN** aparece o aviso de lista inexistente e, ao fechá-lo, a tela de Listas é exibida

#### Scenario: Zerar preços de lista excluída
- **WHEN** o usuário confirma "Zerar" numa lista que foi excluída em outra aba
- **THEN** aparece o aviso de lista inexistente e, ao fechá-lo, a tela de Listas é exibida

### Requirement: Abrir as opções da lista
O botão "⋯" do cabeçalho SHALL abrir, subindo da parte de baixo da tela, o menu com o título "Opções da lista" e as opções, nesta ordem:
- "Desmarcar todos", com o ícone "○";
- "Zerar preços", com o ícone "⊘", em vermelho;
- "Cancelar".

"Cancelar" e o toque fora do menu MUST fechá-lo sem alterar nada. Escolher uma opção fecha o menu antes da confirmação.

#### Scenario: Abrir o menu
- **WHEN** o usuário toca em "⋯" na lista "Feira do sábado"
- **THEN** sobe o menu "Opções da lista" com "Desmarcar todos", "Zerar preços" em vermelho e "Cancelar"

#### Scenario: Fechar sem escolher
- **WHEN** o menu "Opções da lista" está aberto e o usuário toca fora dele
- **THEN** o menu fecha e os itens continuam como estavam

### Requirement: Desmarcar todos os itens pela tela
"Desmarcar todos" SHALL mostrar o dialog de alerta "Desmarcar todos os itens?" com os botões "Desmarcar" e "Cancelar". A mensagem é "Os N itens concluídos voltarão para os pendentes.", ou "O 1 item concluído voltará para os pendentes." quando há um só. Ao confirmar, os itens MUST voltar com animação para as suas posições de inclusão entre os pendentes. O rótulo "Concluídos (N)" some e o rodapé se atualiza.

#### Scenario: Confirmar desmarcar todos
- **WHEN** a lista tem 6 itens, 4 concluídos somando R$ 37,40 e previsto R$ 51,40, e o usuário toca em "⋯", "Desmarcar todos" e "Desmarcar"
- **THEN** os 6 itens aparecem como pendentes na ordem de inclusão, o rótulo "Concluídos" some, o total concluído mostra "R$ 0,00" e o resumo mostra "0 de 6 itens concluídos · previsto R$ 51,40"

#### Scenario: Mensagem com um item concluído
- **WHEN** a lista tem 1 item concluído e o usuário escolhe "Desmarcar todos"
- **THEN** o dialog mostra "O 1 item concluído voltará para os pendentes."

#### Scenario: Cancelar desmarcar todos
- **WHEN** o usuário toca em "Cancelar" no dialog "Desmarcar todos os itens?"
- **THEN** o dialog fecha e os itens concluídos continuam concluídos

#### Scenario: Nenhum item concluído para desmarcar
- **WHEN** nenhum item da lista está concluído e o usuário escolhe "Desmarcar todos"
- **THEN** aparece o dialog "Atenção" com "Nenhum item concluído para desmarcar." e o botão "OK", e nada é gravado

### Requirement: Zerar os preços pela tela
"Zerar preços" SHALL mostrar o dialog de alerta "Zerar preços?" com os botões "Zerar" e "Cancelar". A mensagem é "Os N itens com preço ficarão com valor unitário R$ 0,00. Essa ação não pode ser desfeita.", ou "O 1 item com preço ficará com valor unitário R$ 0,00. Essa ação não pode ser desfeita." quando há um só. Ao confirmar, cada linha MUST mostrar `qtd UN × R$ 0,00` e "R$ 0,00", no mesmo grupo e posição.

#### Scenario: Confirmar zerar preços
- **WHEN** a lista tem 6 itens com preço, 4 deles concluídos, e o usuário toca em "⋯", "Zerar preços" e "Zerar"
- **THEN** a linha "Tomate" mostra "6 UN × R$ 0,00" e "R$ 0,00" e continua entre os concluídos, o total concluído mostra "R$ 0,00" e o resumo mostra "4 de 6 itens concluídos · previsto R$ 0,00"

#### Scenario: Mensagem conta só os itens com preço
- **WHEN** a lista tem 6 itens, 1 deles já com R$ 0,00, e o usuário escolhe "Zerar preços"
- **THEN** o dialog mostra "Os 5 itens com preço ficarão com valor unitário R$ 0,00. Essa ação não pode ser desfeita."

#### Scenario: Cancelar zerar preços
- **WHEN** o usuário toca em "Cancelar" no dialog "Zerar preços?"
- **THEN** o dialog fecha e os preços continuam como estavam

#### Scenario: Nenhum item com preço para zerar
- **WHEN** a lista não tem itens ou todos os itens estão com R$ 0,00, e o usuário escolhe "Zerar preços"
- **THEN** aparece o dialog "Atenção" com "Nenhum item com preço para zerar." e o botão "OK", e nada é gravado

### Requirement: Tratar falhas das ações da lista
Se o banco falhar ao desmarcar todos ou ao zerar os preços, a tela SHALL mostrar o dialog "Ops!" com a mensagem da operação, sem o texto técnico do banco, e os itens MUST continuar como estavam:
- Desmarcar todos: "Não foi possível desmarcar os itens. Tente novamente.";
- Zerar preços: "Não foi possível zerar os preços. Tente novamente.".

#### Scenario: Falha ao zerar preços
- **WHEN** o usuário confirma "Zerar" e o banco falha
- **THEN** aparece "Não foi possível zerar os preços. Tente novamente." e todas as linhas continuam com os preços de antes

#### Scenario: Falha ao desmarcar todos
- **WHEN** o usuário confirma "Desmarcar" e o banco falha
- **THEN** aparece "Não foi possível desmarcar os itens. Tente novamente." e os itens concluídos continuam no grupo "Concluídos"
