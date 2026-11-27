## ADDED Requirements

### Requirement: Desmarcar todos os itens da lista
O sistema SHALL gravar como **não concluído** todos os itens concluídos da lista informada, numa única gravação, e informar quantos itens foram desmarcados. Descrição, quantidade, valor unitário e posição de inclusão MUST continuar como estão. Os itens de outras listas MUST NOT mudar. A lista MUST existir no momento da gravação.

#### Scenario: Desmarcar com itens concluídos
- **WHEN** a lista "Feira do sábado" tem, na ordem de inclusão, "Abacaxi" (pendente), "Tomate" (concluído), "Pimentão" (pendente) e "Alface" (concluído), e o usuário desmarca todos
- **THEN** o banco passa a registrar os quatro itens como não concluídos, com os mesmos dados de antes, e o sistema informa 2 itens desmarcados

#### Scenario: Ordem depois de desmarcar todos
- **WHEN** o usuário desmarca todos os itens da lista do cenário anterior
- **THEN** os itens vêm na ordem "Abacaxi", "Tomate", "Pimentão", "Alface"

#### Scenario: Nenhum item concluído
- **WHEN** o usuário desmarca todos numa lista em que todos os itens estão pendentes
- **THEN** nenhum item muda no banco e o sistema informa 0 itens desmarcados

#### Scenario: Outras listas não mudam
- **WHEN** as listas "Feira do sábado" e "Feira do mês" têm itens concluídos e o usuário desmarca todos em "Feira do sábado"
- **THEN** os itens concluídos de "Feira do mês" continuam concluídos

#### Scenario: Lista que não existe mais
- **WHEN** o usuário desmarca todos numa lista que já foi excluída
- **THEN** nada é gravado e o erro tem a mensagem "Esta lista não existe mais. Atualizamos a tela para você."

### Requirement: Zerar os preços da lista
O sistema SHALL gravar o valor unitário R$ 0,00 em todos os itens da lista informada que tenham valor acima de zero, pendentes ou concluídos, numa única gravação, e informar quantos itens foram alterados. Descrição, quantidade, marcação de concluído e posição de inclusão MUST continuar como estão. Os itens de outras listas MUST NOT mudar. A lista MUST existir no momento da gravação.

#### Scenario: Zerar preços com itens pendentes e concluídos
- **WHEN** a lista tem "Tomate", 6 UN × R$ 1,20, concluído, e "Pimentão", 3 UN × R$ 2,00, pendente, e o usuário zera os preços
- **THEN** o banco passa a registrar "Tomate", 6 UN × R$ 0,00, concluído, e "Pimentão", 3 UN × R$ 0,00, pendente, e o sistema informa 2 itens alterados

#### Scenario: Totais depois de zerar os preços
- **WHEN** uma lista com total concluído R$ 37,40 e previsto R$ 51,40 tem os preços zerados
- **THEN** o total concluído e o previsto passam a R$ 0,00, e a quantidade de itens concluídos continua a mesma

#### Scenario: Item que já estava sem preço
- **WHEN** a lista tem "Alho" com R$ 0,00 e "Cebola" com R$ 4,00, e o usuário zera os preços
- **THEN** os dois ficam com R$ 0,00 e o sistema informa 1 item alterado

#### Scenario: Nenhum item com preço
- **WHEN** o usuário zera os preços numa lista em que todos os itens já estão com R$ 0,00
- **THEN** nenhum item muda no banco e o sistema informa 0 itens alterados

#### Scenario: Outras listas não mudam
- **WHEN** o usuário zera os preços de "Feira do sábado"
- **THEN** os itens de "Feira do mês" continuam com os seus preços

#### Scenario: Lista que não existe mais
- **WHEN** o usuário zera os preços de uma lista que já foi excluída
- **THEN** nada é gravado e o erro tem a mensagem "Esta lista não existe mais. Atualizamos a tela para você."

## MODIFIED Requirements

### Requirement: Separar falha de armazenamento de erro de validação dos itens
Quando o banco falhar ao listar, gravar, marcar ou excluir um item, ou ao desmarcar todos os itens ou zerar os preços de uma lista, o sistema MUST sinalizar a falha da operação sem alterar dados parcialmente. Assim a tela consegue distingui-la de um erro de validação e não mostra o texto técnico do banco.

#### Scenario: Falha ao gravar item
- **WHEN** o banco falha no momento de gravar um item
- **THEN** nenhum item é criado ou alterado e a falha é sinalizada como erro técnico de gravação

#### Scenario: Falha ao zerar os preços
- **WHEN** o banco falha no meio da gravação dos preços de uma lista com 6 itens
- **THEN** os 6 itens continuam com os preços de antes e a falha é sinalizada como erro técnico da operação de zerar preços

#### Scenario: Falha ao desmarcar todos
- **WHEN** o banco falha no meio da gravação ao desmarcar todos os itens de uma lista com 4 concluídos
- **THEN** os 4 itens continuam concluídos e a falha é sinalizada como erro técnico da operação de desmarcar
