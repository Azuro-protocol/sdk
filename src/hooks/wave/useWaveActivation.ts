import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'

import { activateWave } from '../../utils/wave/activateWave'
import { useChain } from '../../contexts/chain'


type Props = {
  account: Address
  waveId: number
}

export const useWaveActivation = ({ waveId, account }: Props) => {
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
