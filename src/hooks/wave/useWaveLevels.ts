import { useQuery } from '@tanstack/react-query'

import { getWaveLevels } from '../../utils/wave/getWaveLevels'
import { useChain } from '../../contexts/chain'
import { type WaveId } from '../../global'


type Props = {
  waveId?: WaveId
}

export const useWaveLevels = ({ waveId }: Props = { waveId: 'active' }) => {
  const { appChain, api } = useChain()

  const queryFn = () => (
    getWaveLevels({
      chainId: appChain.id,
      waveId,
    })
  )

  return useQuery({
    queryKey: [ 'wave/levels', waveId, api ],
    queryFn,
    refetchOnWindowFocus: false,
  })
}
