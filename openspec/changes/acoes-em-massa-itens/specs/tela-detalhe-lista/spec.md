## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Exibir o cabeçalho da lista
A tela SHALL mostrar no topo o botão voltar "‹", o nome da lista, o botão "✎" para renomear e o botão "⋯" para as opções da lista. Nomes que não couberem em uma linha MUST terminar em reticências. Enquanto a lista não foi carregada, os botões "✎" e "⋯" MUST ficar escondidos.

#### Scenario: Abrir a lista
- **WHEN** o usuário abre a lista "Feira do sábado"
- **THEN** o cabeçalho mostra "‹", "Feira do sábado", "✎" e "⋯"

#### Scenario: Lista ainda carregando
- **WHEN** os itens da lista ainda estão sendo lidos
- **THEN** o cabeçalho mostra "‹" sem os botões "✎" e "⋯"

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

### Requirement: Tratar lista ou item que deixou de existir
Se a lista aberta não existir mais, a tela SHALL mostrar o dialog "Atenção" com "Esta lista não existe mais. Atualizamos a tela para você." e voltar para a tela de Listas. Isso vale ao abrir por um endereço antigo, ao gravar um item, ao desmarcar todos e ao zerar os preços. Se um item editado, marcado ou excluído não existir mais, a tela SHALL mostrar "Este item não existe mais. Atualizamos a tela para você.", fechar o painel e recarregar os itens.

#### Scenario: Endereço de lista excluída
- **WHEN** o usuário abre pelo endereço o detalhe de uma lista que já foi excluída
- **THEN** aparece o aviso de lista inexistente e, ao fechá-lo, a tela de Listas é exibida

#### Scenario: Zerar preços de lista excluída
- **WHEN** o usuário confirma "Zerar" numa lista que foi excluída em outra aba
- **THEN** aparece o aviso de lista inexistente e, ao fechá-lo, a tela de Listas é exibida
