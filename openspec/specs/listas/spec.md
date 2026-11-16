# listas Specification

## Purpose
Regras de negócio das listas de feira guardadas no aparelho: criar, renomear, excluir e listar com o resumo dos itens e os totais, garantindo nomes válidos e uma ordem previsível.

## Requirements

### Requirement: Criar lista
O sistema SHALL gravar uma nova lista com o nome informado, sem os espaços das pontas, e com a data de criação igual ao momento da gravação. A lista nova MUST começar sem itens.

#### Scenario: Criação com nome válido
- **WHEN** o usuário cria uma lista com o nome "Feira do sábado"
- **THEN** o banco passa a ter uma lista "Feira do sábado" com a data e hora atuais e nenhum item

#### Scenario: Espaços nas pontas são descartados
- **WHEN** o usuário cria uma lista com o nome "  Churrasco  "
- **THEN** a lista é gravada com o nome "Churrasco"

### Requirement: Validar nome da lista
O sistema MUST recusar, ao criar ou renomear, um nome vazio (depois de descartar os espaços das pontas) ou com mais de 60 caracteres, sem gravar nada. Cada caso SHALL gerar um erro de validação próprio, com a mensagem a ser mostrada ao usuário.

#### Scenario: Nome vazio
- **WHEN** o usuário tenta gravar uma lista com o nome ""
- **THEN** nada é gravado e o erro tem a mensagem "Informe o nome da lista."

#### Scenario: Nome só com espaços
- **WHEN** o usuário tenta gravar uma lista com o nome "    "
- **THEN** nada é gravado e o erro tem a mensagem "Informe o nome da lista."

#### Scenario: Nome com mais de 60 caracteres
- **WHEN** o usuário tenta gravar uma lista com um nome de 61 caracteres
- **THEN** nada é gravado e o erro tem a mensagem "O nome da lista pode ter no máximo 60 caracteres."

#### Scenario: Nome com exatamente 60 caracteres
- **WHEN** o usuário grava uma lista com um nome de 60 caracteres
- **THEN** a lista é gravada com o nome completo

### Requirement: Permitir nomes repetidos
O sistema SHALL permitir mais de uma lista com o mesmo nome.

#### Scenario: Duas listas com o mesmo nome
- **WHEN** já existe a lista "Feira 30/10" e o usuário cria outra lista "Feira 30/10"
- **THEN** o banco passa a ter as duas listas, cada uma com seu próprio identificador

### Requirement: Renomear lista
O sistema SHALL trocar apenas o nome de uma lista existente, aplicando a mesma validação da criação, e MUST manter a data de criação e os itens da lista.

#### Scenario: Renomear lista existente
- **WHEN** o usuário renomeia a lista "Feira 30/10", que tem 3 itens, para "Feira do sábado"
- **THEN** a lista passa a se chamar "Feira do sábado" com a mesma data de criação e os mesmos 3 itens

#### Scenario: Renomear para nome inválido
- **WHEN** o usuário renomeia uma lista para "   "
- **THEN** o nome antigo é mantido e o erro tem a mensagem "Informe o nome da lista."

#### Scenario: Renomear lista que não existe mais
- **WHEN** o usuário renomeia uma lista que já foi excluída
- **THEN** nada é gravado e o erro tem a mensagem "Esta lista não existe mais. Atualizamos a tela para você."

### Requirement: Excluir lista com seus itens
O sistema SHALL excluir a lista e todos os itens dela em uma única operação.

#### Scenario: Excluir lista com itens
- **WHEN** o usuário exclui a lista "Churrasco domingo", que tem 7 itens
- **THEN** a lista e os 7 itens deixam de existir no banco

#### Scenario: Excluir lista sem itens
- **WHEN** o usuário exclui uma lista sem itens
- **THEN** a lista deixa de existir no banco

#### Scenario: Excluir lista que não existe mais
- **WHEN** o usuário exclui uma lista que já foi excluída
- **THEN** o erro tem a mensagem "Esta lista não existe mais. Atualizamos a tela para você."

### Requirement: Listar listas com resumo dos itens
O sistema SHALL devolver todas as listas com: identificador, nome, data de criação, quantidade de itens, quantidade de itens concluídos, total concluído (soma de quantidade × valor unitário só dos itens concluídos) e total previsto (mesma soma considerando todos os itens).

#### Scenario: Lista com itens concluídos e pendentes
- **WHEN** uma lista tem 6 itens, 4 concluídos somando R$ 37,40 e 2 pendentes somando R$ 14,00
- **THEN** a listagem traz 6 itens, 4 concluídos, total concluído R$ 37,40 e total previsto R$ 51,40

#### Scenario: Lista sem itens
- **WHEN** uma lista não tem itens
- **THEN** a listagem traz 0 itens, 0 concluídos, total concluído R$ 0,00 e total previsto R$ 0,00

#### Scenario: Item concluído sem preço
- **WHEN** uma lista tem 1 item concluído com valor unitário R$ 0,00
- **THEN** a listagem traz 1 item, 1 concluído e total concluído R$ 0,00

#### Scenario: Nenhuma lista
- **WHEN** não existe nenhuma lista no banco
- **THEN** a listagem volta vazia, sem erro

### Requirement: Ordenar listas da mais recente para a mais antiga
O sistema SHALL devolver as listas ordenadas pela data de criação, da mais recente para a mais antiga; listas com a mesma data de criação MUST vir da criada por último para a criada primeiro.

#### Scenario: Datas diferentes
- **WHEN** existem listas criadas em 14/10, 28/10 e 30/10
- **THEN** a listagem vem na ordem 30/10, 28/10, 14/10

#### Scenario: Mesma data de criação
- **WHEN** duas listas têm a mesma data e hora de criação
- **THEN** a criada por último vem primeiro

### Requirement: Separar falha de armazenamento de erro de validação
Quando o banco falhar ao listar, gravar ou excluir, o sistema MUST sinalizar a falha da operação sem alterar dados parcialmente, de forma que a tela consiga distingui-la de um erro de validação e não mostre o texto técnico do banco.

#### Scenario: Falha ao gravar
- **WHEN** o banco está bloqueado no momento de gravar uma lista
- **THEN** nenhuma lista é criada ou alterada e a falha é sinalizada como erro técnico de gravação

#### Scenario: Falha ao excluir
- **WHEN** ocorre erro de disco ao excluir uma lista
- **THEN** a lista e seus itens continuam no banco e a falha é sinalizada como erro técnico de exclusão
