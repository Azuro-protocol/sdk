import { useQuery } from '@tanstack/react-query'

import { getWaveLevels } from '../../utils/wave/getWaveLevels'
import { useChain } from '../../contexts/chain'


type Props = {
  waveId: number
}

export const useWaveLevels = ({ waveId }: Props) => {
  const { appChain, api } = useChain()

  const queryFn = () => {
    return getWaveLevels({
      chainId: appChain.id,
      waveId,
    })
  }

  return useQuery({
    queryKey: [ 'wave/levels', waveId, api ],
    queryFn,
    refetchOnWindowFocus: false,
  })
}
