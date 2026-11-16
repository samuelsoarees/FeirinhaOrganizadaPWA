## MODIFIED Requirements

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
