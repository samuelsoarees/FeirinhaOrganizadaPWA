// Todos os textos mostrados ao usuário. As telas e componentes não escrevem textos soltos.

export const Mensagens = {
  geral: {
    ok: 'OK',
    emBreve: 'Em breve',
    voltar: 'Voltar',
    atencao: 'Atenção',
    ops: 'Ops!',
    salvar: 'Salvar',
    cancelar: 'Cancelar',
    carregando: 'Carregando',
  },
  listas: {
    titulo: 'Minhas Listas',
    subtitulo: (quantidade: number) => {
      if (quantidade === 0) return 'nenhuma lista'
      if (quantidade === 1) return '1 lista'
      return `${quantidade} listas`
    },
    vazioTitulo: 'Você ainda não tem listas',
    vazioTexto: 'Crie uma lista para lançar os itens da feira e ver o total da compra.',
    criarPrimeira: 'Criar minha primeira lista',
    erroTitulo: 'Não foi possível carregar suas listas.',
    erroTexto: 'Verifique o armazenamento do aparelho e tente de novo.',
    tentarNovamente: 'Tentar novamente',
    novaLista: 'Nova lista',
    renomearLista: 'Renomear lista',
    nomeDaLista: 'Nome da lista',
    nomeSugerido: (diaMes: string) => `Feira ${diaMes}`,
    resumoItens: (concluidos: number, total: number) => {
      if (total === 0) return 'nenhum item'
      if (total === 1) return `${concluidos} de 1 item`
      return `${concluidos} de ${total} itens`
    },
    legendaConcluido: 'concluído',
    opcoesDe: (nome: string) => `Opções de ${nome}`,
    renomear: 'Renomear',
    excluir: 'Excluir',
    excluirTitulo: 'Excluir lista?',
    excluirMensagem: (nome: string, quantidadeItens: number) => {
      const nomeEntreAspas = `“${nome}”`
      if (quantidadeItens === 0) return `${nomeEntreAspas} será excluída. Essa ação não pode ser desfeita.`
      if (quantidadeItens === 1)
        return `${nomeEntreAspas} e seu 1 item serão excluídos. Essa ação não pode ser desfeita.`
      return `${nomeEntreAspas} e seus ${quantidadeItens} itens serão excluídos. Essa ação não pode ser desfeita.`
    },
    detalheEmBreve: (nome: string) => `O detalhe de “${nome}” chega na próxima etapa.`,
    nomeObrigatorio: 'Informe o nome da lista.',
    nomeMuitoGrande: 'O nome da lista pode ter no máximo 60 caracteres.',
    naoEncontrada: 'Esta lista não existe mais. Atualizamos a tela para você.',
    falhaCarregar: 'Não foi possível carregar suas listas. Tente novamente.',
    falhaSalvar: 'Não foi possível salvar a lista. Tente novamente.',
    falhaExcluir: 'Não foi possível excluir a lista. Tente novamente.',
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
