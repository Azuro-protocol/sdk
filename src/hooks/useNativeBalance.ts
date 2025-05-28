import { useBalance, type UseBalanceParameters } from 'wagmi'
import { formatUnits } from 'viem'
import type { GetBalanceData } from 'wagmi/query'
import { useCallback } from 'react'
import { type ChainId } from '@azuro-org/toolkit'

import { useExtendedAccount } from '../hooks/useAaConnector'
import { useOptionalChain } from '../contexts/chain'


type Props = {
  chainId?: ChainId
  query?: UseBalanceParameters['query']
}

export const useNativeBalance = ({ chainId, query = {} }: Props = {}) => {
  const { address } = useExtendedAccount()

  const { chain: appChain } = useOptionalChain(chainId)

  const formatBalance = useCallback((data: GetBalanceData) => ({
    rawBalance: data.value,
    balance: formatUnits(data.value, data.decimals),
  }), [])

  return useBalance({
    chainId: appChain.id,
    address,
    query: {
      ...query,
      enabled: Boolean(address),
      select: formatBalance,
    },
  })
}
