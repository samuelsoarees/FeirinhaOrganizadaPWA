import { AvisoAtualizacao } from './componentes/AvisoAtualizacao'
import { ProvedorDialog } from './componentes/ProvedorDialog'
import { ProvedorCamadas } from './navegacao/ProvedorCamadas'
import { useRota } from './navegacao/rotas'
import { TelaDetalheProvisoria } from './telas/TelaDetalheProvisoria'
import { TelaListas } from './telas/TelaListas'

export function App() {
  const rota = useRota()

  return (
    <ProvedorCamadas>
      <ProvedorDialog>
        {rota.tela === 'detalhe' ? <TelaDetalheProvisoria idLista={rota.idLista} /> : <TelaListas />}
        <AvisoAtualizacao />
      </ProvedorDialog>
    </ProvedorCamadas>
  )
}
