import { useQuery } from '@tanstack/react-query'
import { type ChainId, type WaveId, type WaveLevelData, getWaveLevels } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type Props = {
  waveId?: WaveId
  chainId?: ChainId
  query?: QueryParameter<WaveLevelData[] | null>
}

export const useWaveLevels = ({ waveId, chainId, query = {} }: Props = { waveId: 'active' }) => {
  const { chain: appChain, api } = useOptionalChain(chainId)

  const queryFn = () => (
    getWaveLevels({
      chainId: appChain.id,
      waveId,
    })
  )

  return useQuery({
    queryKey: [ 'wave/levels', waveId, api ],
    queryFn,
    ...query,
    refetchOnWindowFocus: false,
  })
}
