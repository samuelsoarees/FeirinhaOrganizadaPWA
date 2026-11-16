// Todos os textos mostrados ao usuário. As telas e componentes não escrevem textos soltos.

export const Mensagens = {
  geral: {
    ok: 'OK',
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
    nomeObrigatorio: 'Informe o nome da lista.',
    nomeMuitoGrande: 'O nome da lista pode ter no máximo 60 caracteres.',
    naoEncontrada: 'Esta lista não existe mais. Atualizamos a tela para você.',
    falhaCarregar: 'Não foi possível carregar suas listas. Tente novamente.',
    falhaSalvar: 'Não foi possível salvar a lista. Tente novamente.',
    falhaExcluir: 'Não foi possível excluir a lista. Tente novamente.',
    versao: (versao: string) => `versão ${versao}`,
  },
  detalhe: {
    renomearLista: 'Renomear lista',
    vazio: 'Nenhum item ainda. Toque em + para adicionar.',
    concluidos: (quantidade: number) => `Concluídos (${quantidade})`,
    totalConcluido: 'Total concluído',
    progresso: 'Itens concluídos',
    resumo: (concluidos: number, total: number, previsto: string) => {
      if (total === 0) return `nenhum item · previsto ${previsto}`
      if (total === 1) return `${concluidos} de 1 item concluído · previsto ${previsto}`
      return `${concluidos} de ${total} itens concluídos · previsto ${previsto}`
    },
    adicionarItem: '+ Adicionar item',
    erroTitulo: 'Não foi possível carregar os itens.',
    erroTexto: 'Verifique o armazenamento do aparelho e tente de novo.',
    tentarNovamente: 'Tentar novamente',
    falhaCarregar: 'Não foi possível carregar os itens. Tente novamente.',
  },
  itens: {
    unidade: 'UN',
    detalhe: (quantidade: number, unidade: string, valorUnitario: string) =>
      `${quantidade} ${unidade} × ${valorUnitario}`,
    novoItem: 'Novo item',
    editarItem: 'Editar item',
    descricao: 'Descrição',
    quantidade: 'Quantidade (UN)',
    diminuirQuantidade: 'Diminuir quantidade',
    aumentarQuantidade: 'Aumentar quantidade',
    valorUnitario: 'Valor unitário',
    simboloMoeda: 'R$',
    subtotal: 'Subtotal',
    salvarItem: 'Salvar item',
    excluirItem: 'Excluir item',
    excluir: 'Excluir',
    excluirDe: (descricao: string) => `Excluir ${descricao}`,
    excluirTitulo: 'Excluir item?',
    excluirMensagem: (descricao: string) => `“${descricao}” será excluído. Essa ação não pode ser desfeita.`,
    descricaoObrigatoria: 'Informe a descrição do item.',
    descricaoMuitoGrande: 'A descrição do item pode ter no máximo 80 caracteres.',
    quantidadeInvalida: 'A quantidade deve ser um número inteiro de 1 a 999.',
    valorInvalido: 'O valor unitário deve ficar entre R$ 0,00 e R$ 99.999,99.',
    naoEncontrado: 'Este item não existe mais. Atualizamos a tela para você.',
    falhaSalvar: 'Não foi possível salvar o item. Tente novamente.',
    falhaExcluir: 'Não foi possível excluir o item. Tente novamente.',
    falhaMarcar: 'Não foi possível marcar o item. Tente novamente.',
    marcarComoConcluido: (descricao: string) => `Marcar ${descricao} como concluído`,
  },
  backup: {
    opcoes: 'Opções',
    titulo: 'Backup',
    exportar: 'Exportar backup',
    importar: 'Importar backup',
    semListas: 'Você ainda não tem listas para exportar.',
    tituloArquivo: 'Backup do Feira Organizada',
    nomeArquivo: (dataAaaaMmDd: string) => `feira-organizada-backup-${dataAaaaMmDd}.json`,
    importarTitulo: 'Importar backup?',
    importarConfirmar: 'Importar',
    importarMensagem: (atuais: number, doBackup: number) => {
      const listasDoBackup = doBackup === 1 ? 'pela 1 lista do backup' : `pelas ${doBackup} listas do backup`
      if (atuais === 0) {
        return doBackup === 1 ? 'A 1 lista do backup será importada.' : `As ${doBackup} listas do backup serão importadas.`
      }
      const listasAtuais = atuais === 1 ? 'Sua 1 lista atual será substituída' : `Suas ${atuais} listas atuais serão substituídas`
      return `${listasAtuais} ${listasDoBackup}. Essa ação não pode ser desfeita.`
    },
    arquivoInvalido: 'Este arquivo não é um backup válido do Feira Organizada.',
    falhaExportar: 'Não foi possível exportar o backup. Tente novamente.',
    falhaImportar: 'Não foi possível importar o backup. Tente novamente.',
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
