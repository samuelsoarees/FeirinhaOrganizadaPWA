import { ErroBackupInvalido } from '../dominio/erros'
import { Mensagens } from '../dominio/mensagens'

// Um backup real tem poucos KB; um arquivo muito maior nem é lido.
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024

export type ResultadoEntrega = 'compartilhado' | 'baixado' | 'cancelado'

function baixar(arquivo: File): void {
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = arquivo.name
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // O navegador ainda lê o blob depois do click.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// Oferece o arquivo ao usuário: a folha de compartilhamento do sistema quando ela aceita o arquivo
// (Safari do iPhone, por exemplo) e, senão, o download (o Chrome do Android não compartilha .json).
export async function entregarArquivo(arquivo: File, titulo: string): Promise<ResultadoEntrega> {
  const dados: ShareData = { files: [arquivo], title: titulo }
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare(dados)) {
    try {
      await navigator.share(dados)
      return 'compartilhado'
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === 'AbortError') return 'cancelado'
      // NotAllowedError (o toque "expirou") ou outra falha da folha: cai no download.
    }
  }
  baixar(arquivo)
  return 'baixado'
}

// Texto do arquivo escolhido. Arquivo grande demais ou ilegível → ErroBackupInvalido.
export async function lerTextoDoArquivo(arquivo: Blob): Promise<string> {
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) throw new ErroBackupInvalido(Mensagens.backup.arquivoInvalido)
  try {
    return await arquivo.text()
  } catch (erro) {
    throw new ErroBackupInvalido(Mensagens.backup.arquivoInvalido, erro)
  }
}
