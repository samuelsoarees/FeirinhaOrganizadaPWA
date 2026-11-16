## Purpose

Faz o Feira Organizada funcionar como aplicativo no iPhone e no Android a partir do navegador: instalação na tela inicial, uso sem internet, dados guardados só no aparelho e atualização para novas versões.

## ADDED Requirements

### Requirement: Instalar na tela inicial
O app SHALL poder ser instalado na tela inicial do Android, pelo Chrome, e do iPhone, pelo Safari. Instalado, ele aparece com:
- o nome "Feira Organizada";
- o ícone da barraca sobre o fundo azul-marinho `#181F3D`.

Ao ser aberto pelo ícone, o app MUST ocupar a tela inteira, sem a barra de endereço do navegador.

#### Scenario: Instalação no Android
- **WHEN** o usuário abre o endereço do app no Chrome do Android e escolhe instalar
- **THEN** o ícone "Feira Organizada" aparece na tela inicial e, ao tocá-lo, o app abre em tela cheia em "Minhas Listas"

#### Scenario: Instalação no iPhone
- **WHEN** o usuário abre o endereço no Safari do iPhone e usa Compartilhar → "Adicionar à Tela de Início"
- **THEN** o ícone "Feira Organizada" aparece na tela inicial e o app abre sem a barra do Safari

### Requirement: Oferecer a instalação
No Android, quando o navegador permitir a instalação e o app ainda não estiver instalado, a tela de Listas SHALL mostrar a opção "Instalar app". No iPhone, quando o app estiver aberto no Safari fora da tela inicial, SHALL mostrar um aviso explicando como instalar pelo botão Compartilhar. O aviso inclui o motivo: no iPhone, as listas ficam mais protegidas com o app instalado. O aviso tem o botão "Agora não" e, depois de dispensado, MUST NOT voltar a aparecer naquele aparelho. Com o app já instalado, nenhuma das duas ofertas aparece.

#### Scenario: Aviso no Safari do iPhone
- **WHEN** o usuário abre o app no Safari do iPhone sem tê-lo instalado
- **THEN** a tela mostra o aviso de como adicionar à tela de início, com o botão "Agora não"

#### Scenario: Dispensar o aviso
- **WHEN** o usuário toca em "Agora não" e depois abre o app de novo no Safari
- **THEN** o aviso não aparece

#### Scenario: App já instalado
- **WHEN** o usuário abre o app pelo ícone da tela inicial
- **THEN** nem "Instalar app" nem o aviso de instalação aparecem

### Requirement: Funcionar sem internet
Depois da primeira abertura com internet, o app SHALL abrir e permitir todas as operações com listas e itens sem conexão, inclusive em modo avião.

#### Scenario: Abrir em modo avião
- **WHEN** o usuário já abriu o app uma vez, ativa o modo avião e abre o app pelo ícone
- **THEN** a tela "Minhas Listas" abre com as listas gravadas e é possível criar, editar e marcar itens

### Requirement: Guardar os dados só no aparelho
As listas e os itens SHALL ficar gravados no próprio aparelho e MUST NOT ser enviados pela rede. Os dados MUST continuar disponíveis depois de fechar o app, reiniciar o aparelho ou atualizar o app para uma nova versão.

#### Scenario: Reabrir o app
- **WHEN** o usuário cria a lista "Feira do sábado", fecha o app por completo e abre de novo
- **THEN** "Feira do sábado" continua na tela de Listas

#### Scenario: Nenhum envio de dados
- **WHEN** o usuário cria listas e itens com o aparelho conectado
- **THEN** nenhum conteúdo de lista ou item é enviado pela rede

### Requirement: Pedir armazenamento persistente
Ao gravar a primeira lista, o app SHALL pedir ao navegador que o armazenamento do app seja tratado como persistente, para reduzir o risco de o sistema apagar os dados quando faltar espaço. Se o navegador negar, o app MUST continuar funcionando normalmente, sem mostrar erro.

#### Scenario: Navegador nega o pedido
- **WHEN** o navegador não concede o armazenamento persistente
- **THEN** a lista é gravada normalmente e nenhuma mensagem de erro aparece

### Requirement: Avisar sobre nova versão
Quando uma nova versão do app for publicada, o app aberto SHALL mostrar o aviso "Nova versão disponível" com o botão "Atualizar". O app MUST NOT recarregar sozinho enquanto o usuário usa a tela. "Atualizar" recarrega o app na nova versão, mantendo todas as listas e itens.

#### Scenario: Atualizar
- **WHEN** uma nova versão foi publicada, o usuário abre o app e toca em "Atualizar" no aviso
- **THEN** o app recarrega na nova versão com as mesmas listas e itens de antes

#### Scenario: Ignorar o aviso
- **WHEN** o aviso de nova versão aparece e o usuário continua usando o app sem tocar em "Atualizar"
- **THEN** o app não recarrega sozinho e nada do que o usuário estava fazendo é perdido

### Requirement: Abrir direto em qualquer tela pelo endereço
O app SHALL abrir a tela de Listas pelo endereço principal e a tela de Detalhe de uma lista pelo endereço próprio dela, inclusive ao recarregar a página nessa tela.

#### Scenario: Recarregar no detalhe
- **WHEN** o usuário está no detalhe de "Feira do sábado" no navegador e recarrega a página
- **THEN** o detalhe de "Feira do sábado" abre de novo
