## Purpose

Permite ao usuário guardar uma cópia de todas as suas listas e itens num arquivo e restaurá-la depois. O backup serve para trocar de aparelho ou recuperar os dados se o navegador apagar o armazenamento do app.

## ADDED Requirements

### Requirement: Acessar o backup
A tela de Listas SHALL ter um botão de opções no cabeçalho que abre um menu com "Exportar backup" e "Importar backup". O menu MUST fechar com "Cancelar", com um toque fora dele ou com o voltar do Android.

#### Scenario: Abrir as opções
- **WHEN** o usuário toca no botão de opções do cabeçalho de "Minhas Listas"
- **THEN** o menu abre com "Exportar backup", "Importar backup" e "Cancelar"

### Requirement: Exportar backup
"Exportar backup" SHALL gerar um arquivo `feira-organizada-backup-AAAA-MM-DD.json`, com a data do dia, contendo todas as listas e todos os itens com todos os seus dados. O aparelho então oferece salvar ou compartilhar o arquivo. Quando o app não tiver listas, MUST mostrar o dialog "Atenção" com "Você ainda não tem listas para exportar." e não gerar arquivo.

#### Scenario: Exportar com listas
- **WHEN** em 16/11/2026 o usuário tem 3 listas com 12 itens e toca em "Exportar backup"
- **THEN** o aparelho oferece salvar ou compartilhar o arquivo `feira-organizada-backup-2026-11-16.json` com as 3 listas e os 12 itens

#### Scenario: Exportar sem listas
- **WHEN** o usuário não tem listas e toca em "Exportar backup"
- **THEN** aparece o dialog "Atenção" com "Você ainda não tem listas para exportar." e nenhum arquivo é gerado

### Requirement: Importar backup substituindo os dados
"Importar backup" SHALL abrir o seletor de arquivos do aparelho. Depois de escolhido um backup válido, MUST aparecer o dialog de alerta "Importar backup?" com a mensagem "Suas N listas atuais serão substituídas pelas M listas do backup. Essa ação não pode ser desfeita." e os botões "Importar" e "Cancelar". A mensagem concorda com as quantidades: "Sua 1 lista atual será substituída", "pela 1 lista do backup" e, sem listas no aparelho, "As M listas do backup serão importadas." (ou "A 1 lista do backup será importada."). "Importar" troca todas as listas e itens do aparelho pelos do arquivo, preservando nomes, datas de criação, quantidades, valores, marcações de concluído e a ordem das listas e dos itens, e atualiza a tela de Listas.

#### Scenario: Importar backup válido
- **WHEN** o aparelho tem 2 listas, o usuário escolhe um backup com 3 listas e toca em "Importar"
- **THEN** a tela de Listas passa a mostrar exatamente as 3 listas do backup, com os mesmos totais e itens que tinham quando foram exportadas

#### Scenario: Importar num aparelho sem listas
- **WHEN** o aparelho não tem listas e o usuário escolhe um backup com 3 listas
- **THEN** o dialog "Importar backup?" mostra "As 3 listas do backup serão importadas." e "Importar" traz as 3 listas

#### Scenario: Cancelar a importação
- **WHEN** o usuário escolhe um backup válido e toca em "Cancelar" no dialog
- **THEN** nenhuma lista é alterada

### Requirement: Recusar arquivo inválido
Se o arquivo escolhido não for um backup do Feira Organizada, estiver corrompido, não trouxer nenhuma lista ou trouxer dados que não passam nas regras de listas e itens, o app SHALL mostrar o dialog "Ops!" com "Este arquivo não é um backup válido do Feira Organizada." e MUST NOT alterar nenhum dado.

#### Scenario: Arquivo qualquer
- **WHEN** o usuário escolhe uma foto no seletor de arquivos
- **THEN** aparece "Este arquivo não é um backup válido do Feira Organizada." e as listas continuam as mesmas

#### Scenario: Backup com item inválido
- **WHEN** o usuário escolhe um backup em que um item tem quantidade 0
- **THEN** aparece a mensagem de arquivo inválido e nenhuma lista é alterada

### Requirement: Importar sem perder dados em caso de falha
A substituição dos dados na importação SHALL acontecer de uma vez só. Se o banco falhar no meio, o app MUST manter as listas que existiam antes e mostrar o dialog "Ops!" com "Não foi possível importar o backup. Tente novamente.".

#### Scenario: Falha durante a importação
- **WHEN** o banco falha enquanto grava as listas do backup
- **THEN** aparece "Não foi possível importar o backup. Tente novamente." e as listas anteriores continuam todas no aparelho
