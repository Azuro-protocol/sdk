import { useQuery } from '@tanstack/react-query'
import { type WaveId, getWaveLevels } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'


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
