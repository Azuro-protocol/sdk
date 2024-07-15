import { type Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { type WaveId, getWaveLeaderBoard } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'


type Props = {
  waveId?: WaveId
  account?: Address
  startsAt?: number
  enabled?: boolean
}

export const useWaveLeaderBoard = ({ waveId = 'active', account, startsAt, enabled }: Props) => {
  const { appChain, api } = useChain()

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
    refetchOnWindowFocus: false,
    enabled,
  })
}
