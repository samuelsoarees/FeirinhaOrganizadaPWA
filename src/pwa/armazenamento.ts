let pedido: Promise<void> | null = null

// Pede ao navegador que não apague os dados do app quando faltar espaço.
// Chamado depois de gravar uma lista; pede uma vez por sessão e ignora recusa ou falha.
export function pedirArmazenamentoPersistente(armazenamento: StorageManager | undefined = navigator.storage): Promise<void> {
  pedido ??= (async () => {
    try {
      if (!armazenamento?.persist) return
      if (await armazenamento.persisted?.()) return
      await armazenamento.persist()
    } catch {
      // Sem armazenamento persistente o app continua funcionando normalmente.
    }
  })()
  return pedido
}

// Só para os testes.
export function reiniciarPedidoArmazenamento(): void {
  pedido = null
}
