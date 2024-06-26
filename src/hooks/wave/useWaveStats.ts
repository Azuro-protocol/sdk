import { type Address } from 'viem'
import { useQuery } from '@tanstack/react-query'

import { getWaveStats } from '../../utils/wave/getWaveStats'
import { useChain } from '../../contexts/chain'
import { type WaveId } from '../../global'


type Props = {
  account: Address
  waveId?: WaveId
}

export const useWaveStats = ({ account, waveId = 'active' }: Props) => {
  const { appChain, api } = useChain()

  const queryFn = async () => {
    const data = await getWaveStats({
      account,
      waveId,
      chainId: appChain.id,
    })

    if (!data) {
      return data
    }

    const { address, levelActivated, ...rest } = data

    return {
      ...rest,
      isActivated: levelActivated,
    }
  }

  return useQuery({
    queryKey: [ 'wave/stats', waveId, api, account?.toLowerCase() ],
    queryFn,
    refetchOnWindowFocus: false,
    enabled: Boolean(account),
  })
}
