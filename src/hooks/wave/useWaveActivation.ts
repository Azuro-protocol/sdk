import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'
import { type WaveId, activateWave } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'


type Props = {
  account: Address
  waveId?: WaveId
}

export const useWaveActivation = ({ account, waveId = 'active' }: Props) => {
  const queryClient = useQueryClient()
  const { appChain, api } = useChain()

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
