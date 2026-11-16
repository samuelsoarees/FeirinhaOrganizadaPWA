## Purpose

Regras de negócio dos itens de uma lista de feira: cadastro, validação, edição, exclusão, marcação de concluído, ordem de exibição e cálculo dos totais da lista.

## ADDED Requirements

### Requirement: Criar item
O sistema SHALL gravar um novo item na lista informada com:
- a descrição sem os espaços das pontas;
- a unidade "UN";
- a quantidade e o valor unitário informados;
- a marcação de **não concluído**.

A lista MUST existir no momento da gravação.

#### Scenario: Criação com dados válidos
- **WHEN** o usuário cria na lista "Feira do sábado" o item "Banana prata" com quantidade 5 e valor unitário R$ 0,75
- **THEN** o banco passa a ter o item "Banana prata", 5 UN, R$ 0,75, não concluído, ligado a "Feira do sábado"

#### Scenario: Espaços nas pontas são descartados
- **WHEN** o usuário cria o item "  Tomate  "
- **THEN** o item é gravado com a descrição "Tomate"

#### Scenario: Lista que não existe mais
- **WHEN** o usuário tenta criar um item numa lista que já foi excluída
- **THEN** nada é gravado e o erro tem a mensagem "Esta lista não existe mais. Atualizamos a tela para você."

### Requirement: Validar item
O sistema MUST recusar, ao criar ou editar, um item com:
- descrição vazia, depois de descartar os espaços das pontas;
- descrição com mais de 80 caracteres;
- quantidade que não seja um número inteiro de 1 a 999;
- valor unitário negativo, acima de R$ 99.999,99 ou com mais de duas casas decimais.

Nesses casos nada é gravado. Cada caso SHALL gerar um erro de validação próprio, com a mensagem a ser mostrada ao usuário.

#### Scenario: Descrição vazia
- **WHEN** o usuário tenta gravar um item com a descrição "   "
- **THEN** nada é gravado e o erro tem a mensagem "Informe a descrição do item."

#### Scenario: Descrição com mais de 80 caracteres
- **WHEN** o usuário tenta gravar um item com uma descrição de 81 caracteres
- **THEN** nada é gravado e o erro tem a mensagem "A descrição do item pode ter no máximo 80 caracteres."

#### Scenario: Descrição com exatamente 80 caracteres
- **WHEN** o usuário grava um item com uma descrição de 80 caracteres
- **THEN** o item é gravado com a descrição completa

#### Scenario: Quantidade zero
- **WHEN** o usuário tenta gravar um item com quantidade 0
- **THEN** nada é gravado e o erro tem a mensagem "A quantidade deve ser um número inteiro de 1 a 999."

#### Scenario: Quantidade fracionada
- **WHEN** o usuário tenta gravar um item com quantidade 1,5
- **THEN** nada é gravado e o erro tem a mensagem "A quantidade deve ser um número inteiro de 1 a 999."

#### Scenario: Quantidade acima do limite
- **WHEN** o usuário tenta gravar um item com quantidade 1000
- **THEN** nada é gravado e o erro tem a mensagem "A quantidade deve ser um número inteiro de 1 a 999."

#### Scenario: Valor negativo
- **WHEN** o usuário tenta gravar um item com valor unitário -1,00
- **THEN** nada é gravado e o erro tem a mensagem "O valor unitário deve ficar entre R$ 0,00 e R$ 99.999,99."

#### Scenario: Valor acima do limite
- **WHEN** o usuário tenta gravar um item com valor unitário R$ 100.000,00
- **THEN** nada é gravado e o erro tem a mensagem "O valor unitário deve ficar entre R$ 0,00 e R$ 99.999,99."

#### Scenario: Valor zero
- **WHEN** o usuário grava um item com valor unitário R$ 0,00
- **THEN** o item é gravado com valor unitário R$ 0,00

### Requirement: Editar item
O sistema SHALL trocar a descrição, a quantidade e o valor unitário de um item existente, aplicando a mesma validação da criação. A edição MUST manter a lista do item, a sua posição de inclusão e a marcação de concluído.

#### Scenario: Editar item concluído
- **WHEN** o usuário edita o item concluído "Tomate", 6 UN × R$ 1,20, para 8 UN × R$ 1,10
- **THEN** o item passa a ter 8 UN × R$ 1,10 e continua concluído

#### Scenario: Editar item que não existe mais
- **WHEN** o usuário salva a edição de um item que já foi excluído
- **THEN** nada é gravado e o erro tem a mensagem "Este item não existe mais. Atualizamos a tela para você."

### Requirement: Excluir item
O sistema SHALL excluir um item da lista sem alterar os demais itens.

#### Scenario: Excluir item
- **WHEN** o usuário exclui o item "Pimentão" de uma lista com 6 itens
- **THEN** a lista passa a ter 5 itens e "Pimentão" deixa de existir no banco

#### Scenario: Excluir item que não existe mais
- **WHEN** o usuário exclui um item que já foi excluído
- **THEN** o erro tem a mensagem "Este item não existe mais. Atualizamos a tela para você."

### Requirement: Marcar e desmarcar item como concluído
O sistema SHALL gravar apenas a marcação de concluído de um item existente, sem alterar descrição, quantidade, valor ou posição de inclusão. Um item com valor unitário R$ 0,00 MUST poder ser marcado.

#### Scenario: Marcar item
- **WHEN** o usuário marca o item pendente "Pimentão" como concluído
- **THEN** o banco passa a registrar "Pimentão" como concluído, com os mesmos dados de antes

#### Scenario: Desmarcar item
- **WHEN** o usuário desmarca o item concluído "Tomate"
- **THEN** o banco passa a registrar "Tomate" como não concluído

#### Scenario: Marcar item sem preço
- **WHEN** o usuário marca como concluído um item com valor unitário R$ 0,00
- **THEN** o item fica concluído e o total concluído da lista não muda

#### Scenario: Marcar item que não existe mais
- **WHEN** o usuário marca um item que já foi excluído
- **THEN** o erro tem a mensagem "Este item não existe mais. Atualizamos a tela para você."

### Requirement: Ordenar itens da lista
O sistema SHALL devolver os itens de uma lista com os pendentes primeiro e os concluídos no fim. Dentro de cada grupo, a ordem é a de inclusão. Um item desmarcado MUST voltar à sua posição de inclusão entre os pendentes.

#### Scenario: Pendentes antes dos concluídos
- **WHEN** a lista tem, na ordem de inclusão, "Tomate" (concluído), "Abacaxi" (pendente) e "Alface" (concluído)
- **THEN** os itens vêm na ordem "Abacaxi", "Tomate", "Alface"

#### Scenario: Desmarcar volta à posição de inclusão
- **WHEN** a lista tem, na ordem de inclusão, "Abacaxi", "Pimentão" e "Tomate", todos pendentes, e o usuário marca e depois desmarca "Abacaxi"
- **THEN** os itens vêm na ordem "Abacaxi", "Pimentão", "Tomate"

### Requirement: Calcular subtotal e totais da lista
O sistema SHALL calcular:
- o subtotal de cada item, como quantidade × valor unitário;
- o total concluído da lista, como a soma dos subtotais só dos itens concluídos;
- o total previsto, como a soma dos subtotais de todos os itens.

Os cálculos MUST ser exatos em centavos, sem erro de arredondamento.

#### Scenario: Totais com concluídos e pendentes
- **WHEN** uma lista tem 4 itens concluídos somando R$ 37,40 e 2 pendentes somando R$ 14,00
- **THEN** o total concluído é R$ 37,40 e o previsto é R$ 51,40

#### Scenario: Soma sem erro de arredondamento
- **WHEN** uma lista tem três itens concluídos de 1 UN × R$ 0,10
- **THEN** o total concluído é exatamente R$ 0,30

#### Scenario: Subtotal
- **WHEN** um item tem 12 UN × R$ 1,10
- **THEN** o subtotal é R$ 13,20

### Requirement: Separar falha de armazenamento de erro de validação dos itens
Quando o banco falhar ao listar, gravar, marcar ou excluir um item, o sistema MUST sinalizar a falha da operação sem alterar dados parcialmente, de forma que a tela consiga distingui-la de um erro de validação e não mostre o texto técnico do banco.

#### Scenario: Falha ao gravar item
- **WHEN** o banco falha no momento de gravar um item
- **THEN** nenhum item é criado ou alterado e a falha é sinalizada como erro técnico de gravação
