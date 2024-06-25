import { type Address } from 'viem'
import { useQuery } from '@tanstack/react-query'

import { getWaveStats } from '../../utils/wave/getWaveStats'
import { useChain } from '../../contexts/chain'


type Props = {
  account: Address
  waveId: number
}

export const useWaveStats = ({ account, waveId }: Props) => {
  const { appChain, api } = useChain()

  const queryFn = () => (
    getWaveStats({
      account,
      waveId,
      chainId: appChain.id,
    })
  )

  return useQuery({
    queryKey: [ 'wave/stats', waveId, api, account?.toLowerCase() ],
    queryFn,
    refetchOnWindowFocus: false,
    enabled: Boolean(account),
  })
}
