import { type Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { getCalculatedCashout } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'


type Props = {
  account: Address
  betId: string
  isLive: boolean
}

export const useCalculatedCashout = ({ account, betId, isLive }: Props) => {
  const { appChain, api } = useChain()

  const queryFn = () => (
    getCalculatedCashout({
      chainId: appChain.id,
      account,
      betId,
      isLive,
    })
  )

  return useQuery({
    queryKey: [ 'cashout/calculate', api, account?.toLowerCase(), betId, isLive ],
    queryFn,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })
}
