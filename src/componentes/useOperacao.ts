import { useCallback, useEffect, useRef, useState } from 'react'
import { ErroNaoEncontrado, ErroValidacao } from '../dominio/erros'
import { Mensagens } from '../dominio/mensagens'
import { usePilhaCamadas } from '../navegacao/camadas'
import type { OpcoesDialog } from './Dialog'
import { useDialog } from './useDialog'

// Operações mais rápidas que isso terminam sem mostrar o indicador, para a tela não piscar.
export const ATRASO_INDICADOR_MS = 300

export type ResultadoOperacao<T> =
  | { status: 'ok'; valor: T }
  // `dialogFechado` resolve quando o usuário fecha o "Atenção" ou o "Ops!" do erro.
  | { status: 'erro'; erro: unknown; dialogFechado: Promise<boolean> }
  // Outra operação estava em andamento.
  | { status: 'ignorada' }

export type OpcoesOperacao = {
  // Mensagem do "Ops!" para falhas técnicas. O texto técnico do erro nunca aparece.
  mensagemFalha: string
}

export type ExecutarOperacao = <T>(acao: () => Promise<T>, opcoes: OpcoesOperacao) => Promise<ResultadoOperacao<T>>

export function dialogDoErro(erro: unknown, mensagemFalha: string): OpcoesDialog {
  if (erro instanceof ErroValidacao || erro instanceof ErroNaoEncontrado) {
    return { icone: 'alerta', titulo: Mensagens.geral.atencao, mensagem: erro.message }
  }
  return { icone: 'erro', titulo: Mensagens.geral.ops, mensagem: mensagemFalha }
}

// Equivalente ao TMobileThreading + ExibirErro do Delphi:
// - bloqueia toques e o voltar desde o início (`ocupado`);
// - mostra o indicador só depois de 300 ms (`mostrarIndicador`);
// - uma operação por vez: chamadas durante outra são ignoradas;
// - erro → dialog "Atenção" (regra) ou "Ops!" (falha técnica).
export function useOperacao(): {
  executar: ExecutarOperacao
  ocupado: boolean
  mostrarIndicador: boolean
} {
  const mostrarDialog = useDialog()
  const pilha = usePilhaCamadas()
  const emAndamento = useRef(false)
  const montado = useRef(true)
  const [ocupado, setOcupado] = useState(false)
  const [mostrarIndicador, setMostrarIndicador] = useState(false)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const executar = useCallback<ExecutarOperacao>(
    async (acao, opcoes) => {
      if (emAndamento.current) return { status: 'ignorada' }
      emAndamento.current = true
      pilha.definirBloqueio(true)
      setOcupado(true)
      const temporizador = setTimeout(() => {
        if (montado.current) setMostrarIndicador(true)
      }, ATRASO_INDICADOR_MS)

      try {
        const valor = await acao()
        return { status: 'ok', valor }
      } catch (erro) {
        const dialogFechado = mostrarDialog(dialogDoErro(erro, opcoes.mensagemFalha))
        return { status: 'erro', erro, dialogFechado }
      } finally {
        clearTimeout(temporizador)
        emAndamento.current = false
        pilha.definirBloqueio(false)
        if (montado.current) {
          setOcupado(false)
          setMostrarIndicador(false)
        }
      }
    },
    [mostrarDialog, pilha],
  )

  return { executar, ocupado, mostrarIndicador }
}
