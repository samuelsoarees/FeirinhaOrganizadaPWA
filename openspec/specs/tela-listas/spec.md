# tela-listas Specification

## Purpose
Tela inicial do app, onde o usuário vê suas listas de feira com o progresso e o total já comprado, cria novas listas, renomeia ou exclui as existentes e entra em cada uma.

## Requirements

### Requirement: Abrir o app na tela de Listas
O app SHALL abrir diretamente na tela de Listas, com o título "Minhas Listas", sem passar pela tela de login.

#### Scenario: Abertura do app
- **WHEN** o usuário abre o app
- **THEN** a primeira tela exibida é "Minhas Listas"

### Requirement: Indicar carregamento
Enquanto as listas são lidas ou uma lista é gravada ou excluída, a tela MUST ignorar toques no conteúdo desde o início da operação. O indicador de carregamento SHALL aparecer sobre o conteúdo quando a operação passar de 300 ms e MUST sumir ao fim dela. Operações mais rápidas terminam sem mostrar o indicador, para a tela não piscar.

#### Scenario: Leitura em andamento
- **WHEN** a leitura das listas leva mais de 300 ms
- **THEN** o indicador de carregamento aparece sobre o conteúdo e toques em cards ou botões não têm efeito até a leitura terminar

#### Scenario: Leitura rápida
- **WHEN** a leitura das listas termina em menos de 300 ms
- **THEN** as listas aparecem sem o indicador de carregamento ter sido mostrado

#### Scenario: Toque durante gravação rápida
- **WHEN** o usuário toca em um card enquanto uma lista está sendo gravada, antes de o indicador aparecer
- **THEN** o toque não tem efeito

### Requirement: Exibir as listas em cards
A tela SHALL exibir um card por lista, na ordem devolvida pela listagem, e um subtítulo com a quantidade de listas. Cada card MUST mostrar o nome da lista, a data de criação, o resumo de itens, o total concluído com a legenda "concluído" e o botão "⋮".

#### Scenario: Card de lista com itens
- **WHEN** existe a lista "Feira do sábado", criada em 30/10/2026, com 6 itens, 4 concluídos e total concluído R$ 37,40
- **THEN** o card mostra "Feira do sábado", "30/10/2026 · 4 de 6 itens" e "R$ 37,40" com a legenda "concluído"

#### Scenario: Subtítulo no plural
- **WHEN** existem 4 listas
- **THEN** o subtítulo mostra "4 listas"

#### Scenario: Subtítulo no singular
- **WHEN** existe 1 lista
- **THEN** o subtítulo mostra "1 lista"

#### Scenario: Muitas listas
- **WHEN** existem mais listas do que cabem na tela
- **THEN** a área dos cards rola na vertical e o último card pode ser rolado até ficar acima do botão "+"

### Requirement: Formatar os textos do card
O card SHALL formatar valores como `R$ #.##0,00` com vírgula decimal e ponto de milhar independentemente do idioma do aparelho, datas como `dd/mm/aaaa` e o resumo de itens como "nenhum item", "c de 1 item" ou "c de n itens". Nomes que não couberem em uma linha MUST terminar em reticências.

#### Scenario: Valor com milhar
- **WHEN** o total concluído de uma lista é 12345,67
- **THEN** o card mostra "R$ 12.345,67"

#### Scenario: Aparelho em inglês
- **WHEN** o idioma do aparelho é inglês e o total concluído é 37,4
- **THEN** o card mostra "R$ 37,40"

#### Scenario: Lista sem itens
- **WHEN** a lista não tem itens
- **THEN** o resumo mostra "nenhum item" e o valor "R$ 0,00"

#### Scenario: Lista com um item
- **WHEN** a lista tem 1 item e nenhum concluído
- **THEN** o resumo mostra "0 de 1 item"

#### Scenario: Nome longo
- **WHEN** o nome da lista tem 60 caracteres
- **THEN** o card mostra o nome em uma linha terminada em reticências, sem empurrar o valor nem o "⋮"

### Requirement: Manter a cor da faixa de cada lista
Cada card SHALL ter uma faixa colorida à esquerda com uma das quatro cores do toldo (#4BBBBD, #FDCB6E, #C2BE55, #E9775F), determinada pela própria lista, de forma que a cor de uma lista MUST NOT mudar quando outras listas são criadas ou excluídas.

#### Scenario: Criar outra lista
- **WHEN** a lista "Feira do sábado" tem a faixa #4BBBBD e o usuário cria uma lista nova
- **THEN** "Feira do sábado" continua com a faixa #4BBBBD

### Requirement: Exibir estado vazio
Quando não houver listas, a tela SHALL mostrar a ilustração da barraca, o título "Você ainda não tem listas", o texto "Crie uma lista para lançar os itens da feira e ver o total da compra." e o botão "Criar minha primeira lista"; o subtítulo MUST mostrar "nenhuma lista" e o botão "+" MUST ficar escondido.

#### Scenario: Primeiro uso
- **WHEN** o usuário abre o app sem nenhuma lista gravada
- **THEN** a tela mostra o estado vazio e não mostra o botão "+"

#### Scenario: Excluir a última lista
- **WHEN** o usuário exclui a única lista existente
- **THEN** a tela passa para o estado vazio

### Requirement: Criar lista pelo modal
O botão "+" e o botão "Criar minha primeira lista" SHALL abrir o modal "Nova lista" com o campo "Nome da lista" preenchido com `Feira dd/mm` (data do dia), com o texto todo selecionado e o teclado aberto. O campo MUST aceitar no máximo 60 caracteres. "Salvar" ou a tecla de confirmar do teclado grava; "Cancelar" fecha sem gravar; tocar fora do modal MUST NOT fechá-lo.

#### Scenario: Aceitar o nome sugerido
- **WHEN** em 31/10 o usuário toca em "+" e depois em "Salvar"
- **THEN** o modal fecha, a lista "Feira 31/10" aparece como primeiro card, a área dos cards volta ao topo e o subtítulo soma uma lista

#### Scenario: Digitar outro nome
- **WHEN** o usuário abre o modal e digita "Churrasco"
- **THEN** o texto sugerido é substituído por "Churrasco"

#### Scenario: Cancelar
- **WHEN** o usuário abre o modal e toca em "Cancelar"
- **THEN** o modal fecha e nenhuma lista é criada

#### Scenario: Toque fora do modal
- **WHEN** o usuário toca na área escurecida fora do modal
- **THEN** o modal continua aberto com o texto digitado

### Requirement: Mostrar erro de validação sem perder o que foi digitado
Quando a gravação for recusada por validação do nome, a tela SHALL mostrar o dialog de aviso com o título "Atenção" e a mensagem da regra, e o modal MUST continuar aberto com o texto que o usuário digitou.

#### Scenario: Salvar sem nome
- **WHEN** o usuário apaga o nome no modal e toca em "Salvar"
- **THEN** aparece o dialog "Atenção" com "Informe o nome da lista." e, ao fechá-lo, o modal continua aberto

### Requirement: Abrir o menu do card
Tocar no "⋮" do card ou manter o dedo pressionado sobre o card SHALL abrir um painel na parte de baixo da tela com o nome da lista e as opções "Renomear", "Excluir" (em vermelho) e "Cancelar". O painel MUST fechar com "Cancelar", com um toque fora dele ou com o botão voltar do Android.

#### Scenario: Menu pelo "⋮"
- **WHEN** o usuário toca no "⋮" do card "Churrasco domingo"
- **THEN** o painel abre com o título "Churrasco domingo" e as opções "Renomear", "Excluir" e "Cancelar", sem abrir a lista

#### Scenario: Menu pelo toque longo
- **WHEN** o usuário mantém o dedo pressionado sobre um card por cerca de meio segundo
- **THEN** o painel do menu abre e, ao soltar o dedo, a lista não é aberta

#### Scenario: Fechar tocando fora
- **WHEN** o menu está aberto e o usuário toca fora do painel
- **THEN** o menu fecha sem nenhuma alteração

### Requirement: Renomear lista pela tela
A opção "Renomear" SHALL fechar o menu e abrir o modal com o título "Renomear lista" e o nome atual preenchido e selecionado; ao salvar, o card MUST mostrar o novo nome.

#### Scenario: Renomear
- **WHEN** o usuário escolhe "Renomear" na lista "Feira 30/10", digita "Feira do sábado" e salva
- **THEN** o modal fecha e o card passa a mostrar "Feira do sábado"

### Requirement: Confirmar antes de excluir
A opção "Excluir" SHALL fechar o menu e abrir o dialog de alerta "Excluir lista?" com os botões "Excluir" e "Cancelar". A mensagem MUST informar o nome da lista e quantos itens serão perdidos. "Cancelar" fecha sem alterar nada; "Excluir" exclui e atualiza a tela.

#### Scenario: Lista com vários itens
- **WHEN** o usuário pede para excluir "Churrasco domingo", que tem 7 itens
- **THEN** a mensagem é "“Churrasco domingo” e seus 7 itens serão excluídos. Essa ação não pode ser desfeita."

#### Scenario: Lista com um item
- **WHEN** o usuário pede para excluir "Frutas", que tem 1 item
- **THEN** a mensagem é "“Frutas” e seu 1 item serão excluídos. Essa ação não pode ser desfeita."

#### Scenario: Lista sem itens
- **WHEN** o usuário pede para excluir "Feira 14/10", que não tem itens
- **THEN** a mensagem é "“Feira 14/10” será excluída. Essa ação não pode ser desfeita."

#### Scenario: Cancelar a exclusão
- **WHEN** o usuário toca em "Cancelar" no dialog
- **THEN** o dialog fecha e o card continua na tela

#### Scenario: Confirmar a exclusão
- **WHEN** o usuário toca em "Excluir" no dialog
- **THEN** o card some e o subtítulo diminui uma lista

### Requirement: Abrir a lista ao tocar no card
Um toque simples no card SHALL abrir a tela de Detalhe daquela lista. Arrastar o dedo para rolar a tela, mesmo começando em cima de um card, MUST NOT abrir a lista.

#### Scenario: Toque no card
- **WHEN** o usuário toca no card "Feira do sábado"
- **THEN** a tela de Detalhe abre com o título "Feira do sábado"

#### Scenario: Rolar começando sobre um card
- **WHEN** o usuário arrasta o dedo para rolar a tela começando em cima de um card
- **THEN** a tela rola e a lista não é aberta

#### Scenario: Voltar do detalhe mostra os totais atualizados
- **WHEN** o usuário abre "Feira do sábado", marca um item de R$ 6,00 como concluído e volta
- **THEN** o card "Feira do sábado" mostra o total concluído somado de R$ 6,00 e o resumo com um concluído a mais

### Requirement: Tratar falha ao carregar
Se a leitura das listas falhar, a tela SHALL mostrar o dialog de erro com o título "Ops!" e a mensagem "Não foi possível carregar suas listas. Tente novamente." e, por baixo, um estado de erro com o botão "Tentar novamente"; o subtítulo MUST ficar vazio e o botão "+" escondido.

#### Scenario: Banco ilegível
- **WHEN** o banco falha ao ler as listas
- **THEN** aparece o dialog "Ops!" com a mensagem de falha ao carregar e a tela fica no estado de erro

#### Scenario: Tentar novamente com sucesso
- **WHEN** a tela está no estado de erro, o banco volta a responder e o usuário toca em "Tentar novamente"
- **THEN** as listas são carregadas e exibidas normalmente

### Requirement: Tratar falha ao salvar ou excluir
Se o banco falhar ao gravar ou excluir uma lista, a tela SHALL mostrar o dialog "Ops!" com "Não foi possível salvar a lista. Tente novamente." ou "Não foi possível excluir a lista. Tente novamente.", MUST NOT mostrar o texto técnico do banco e MUST continuar utilizável. Na falha ao salvar, o modal continua aberto com o texto digitado; na falha ao excluir, o card continua na tela.

#### Scenario: Falha ao salvar
- **WHEN** o usuário salva uma lista e o banco está bloqueado
- **THEN** aparece "Não foi possível salvar a lista. Tente novamente." e o modal continua aberto com o nome digitado

#### Scenario: Falha ao excluir
- **WHEN** o usuário confirma a exclusão e o banco falha
- **THEN** aparece "Não foi possível excluir a lista. Tente novamente." e o card continua na tela

### Requirement: Tratar lista que deixou de existir
Se ao renomear ou excluir a lista já não existir, a tela SHALL mostrar o dialog "Atenção" com "Esta lista não existe mais. Atualizamos a tela para você.", fechar o modal ou o menu e recarregar as listas.

#### Scenario: Renomear lista já excluída
- **WHEN** o usuário salva o novo nome de uma lista que não existe mais
- **THEN** aparece o aviso, o modal fecha e a lista some da tela

### Requirement: Executar uma operação por vez
A tela MUST ignorar novos pedidos de carregar, salvar ou excluir enquanto uma dessas operações estiver em andamento.

#### Scenario: Toque duplo em Salvar
- **WHEN** o usuário toca duas vezes seguidas e rápido em "Salvar"
- **THEN** apenas uma lista é criada

### Requirement: Tratar o botão voltar do Android
O botão ou gesto voltar do Android, no navegador ou no app instalado, SHALL fechar uma camada por toque, nesta ordem de prioridade: o dialog aberto, o modal aberto, o menu aberto. Sem nada aberto, MUST seguir o comportamento padrão de sair do app. Com o carregamento em andamento, o voltar MUST ser ignorado.

#### Scenario: Voltar com o modal aberto
- **WHEN** o modal "Nova lista" está aberto e o usuário toca em voltar
- **THEN** o modal fecha e o app continua na tela de Listas

#### Scenario: Voltar com o menu aberto
- **WHEN** o menu do card está aberto e o usuário toca em voltar
- **THEN** o menu fecha e o app continua na tela de Listas

#### Scenario: Voltar com o dialog de confirmação aberto
- **WHEN** o dialog "Excluir lista?" está aberto e o usuário toca em voltar
- **THEN** o dialog fecha, nada é excluído e o app continua na tela de Listas

#### Scenario: Voltar sem nada aberto
- **WHEN** o app está instalado, nada está aberto sobre a tela de Listas e o usuário toca em voltar
- **THEN** o app é encerrado como no comportamento padrão do Android
