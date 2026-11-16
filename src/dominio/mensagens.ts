// Todos os textos mostrados ao usuário. As telas e componentes não escrevem textos soltos.

export const Mensagens = {
  geral: {
    ok: 'OK',
    emBreve: 'Em breve',
    voltar: 'Voltar',
  },
  listas: {
    titulo: 'Minhas Listas',
    subtituloNenhuma: 'nenhuma lista',
    vazioTitulo: 'Você ainda não tem listas',
    vazioTexto: 'Crie uma lista para lançar os itens da feira e ver o total da compra.',
    criarPrimeira: 'Criar minha primeira lista',
    criarEmBreve: 'A criação de listas chega na próxima etapa.',
    versao: (versao: string) => `versão ${versao}`,
  },
  detalheProvisorio: {
    titulo: (id: string) => `Lista ${id}`,
    texto: 'O detalhe da lista chega numa próxima etapa.',
  },
  instalacao: {
    instalarApp: 'Instalar app',
    iosTitulo: 'Instale o app no iPhone',
    iosTexto:
      'Toque em Compartilhar e depois em “Adicionar à Tela de Início”. No iPhone, suas listas ficam mais protegidas com o app instalado.',
    agoraNao: 'Agora não',
  },
  atualizacao: {
    novaVersao: 'Nova versão disponível',
    atualizar: 'Atualizar',
  },
} as const
