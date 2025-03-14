import { getCashbackBalance } from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { type Address } from 'viem'

import { useExtendedAccount } from '../useAaConnector'
import { useChain } from '../../contexts/chain'


type Props = {
  affiliate: Address
  refetchInterval?: number
}

export const useCashbackBalance = ({ affiliate, refetchInterval }: Props) => {
  const { address } = useExtendedAccount()
  const { appChain } = useChain()

  const queryFn = async () => {
    const balance = await getCashbackBalance({
      account: address!,
      affiliate,
      chainId: appChain.id,
    })

    return balance?.amount
  }

  return useQuery({
    queryKey: [ 'cashback/balance', address, affiliate, appChain.id ],
    queryFn,
    refetchInterval,
    enabled: (
      Boolean(address)
    ),
  })
}
