import { AvisoAtualizacao } from './componentes/AvisoAtualizacao'
import { ProvedorDialog } from './componentes/ProvedorDialog'
import { usePilhaCamadas } from './navegacao/camadas'
import { ProvedorCamadas } from './navegacao/ProvedorCamadas'
import { useRota } from './navegacao/rotas'
import { TelaDetalheLista } from './telas/TelaDetalheLista'
import { TelaListas } from './telas/TelaListas'

export function App() {
  return (
    <ProvedorCamadas>
      <ProvedorDialog>
        <Telas />
        <AvisoAtualizacao />
      </ProvedorDialog>
    </ProvedorCamadas>
  )
}

function Telas() {
  const pilha = usePilhaCamadas()
  // Com uma operação em andamento, o voltar do Android não troca de tela.
  const rota = useRota(() => pilha.bloqueada)

  if (rota.tela === 'detalhe') return <TelaDetalheLista key={rota.idLista} idLista={Number(rota.idLista)} />
  return <TelaListas />
}
