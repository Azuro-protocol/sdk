import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'
import { type ChainId, type WaveId, activateWave } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'


type Props = {
  account: Address
  waveId?: WaveId
  chainId?: ChainId
}

export const useWaveActivation = ({ account, waveId = 'active', chainId }: Props) => {
  const queryClient = useQueryClient()
  const { chain: appChain, api } = useOptionalChain(chainId)

  const mutationFn = () => (
    activateWave({
      account,
      waveId,
      chainId: appChain.id,
    })
  )

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'wave/stats', waveId, api, account?.toLowerCase() ] })
      queryClient.invalidateQueries({ queryKey: [ 'wave/leaderboard', waveId, api, account?.toLowerCase() ] })
    },
  })

  return {
    activate: mutate,
    activateAsync: mutateAsync,
    isPending,
  }
}
