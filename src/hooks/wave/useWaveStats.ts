import { type Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { type ChainId, type WaveId, type WaveStatsResponse, getWaveStats } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type WaveStats = {
  isActivated: boolean
} & WaveStatsResponse

type Props = {
  account: Address
  waveId?: WaveId
  chainId?: ChainId
  query?: QueryParameter<WaveStats | null>
}

export const useWaveStats = ({ account, waveId = 'active', chainId, query = {} }: Props) => {
  const { chain: appChain, api } = useOptionalChain(chainId)

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
      address,
      levelActivated,
      isActivated: levelActivated,
    }
  }

  return useQuery({
    queryKey: [ 'wave/stats', waveId, api, account?.toLowerCase() ],
    queryFn,
    ...query,
    refetchOnWindowFocus: false,
    enabled: Boolean(account),
  })
}
