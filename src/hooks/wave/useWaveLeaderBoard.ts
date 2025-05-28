import { type Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { type ChainId, type WaveId, getWaveLeaderBoard, type WaveLeaderBoardItem } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type Props = {
  waveId?: WaveId
  account?: Address
  startsAt?: number
  chainId?: ChainId
  query?: QueryParameter<WaveLeaderBoardItem[] | null>
}

export const useWaveLeaderBoard = (props: Props) => {
  const { waveId = 'active', account, startsAt, chainId, query = {} } = props
  const { chain: appChain, api } = useOptionalChain(chainId)

  const queryFn = () => (
    getWaveLeaderBoard({
      waveId,
      account,
      startsAt,
      chainId: appChain.id,
    })
  )

  return useQuery({
    queryKey: [ 'wave/leaderboard', waveId, api, account?.toLowerCase(), startsAt ],
    queryFn,
    ...query,
    refetchOnWindowFocus: false,
  })
}
