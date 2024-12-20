import { useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { useCallback } from 'react'
import type { GetBalanceData } from 'wagmi/query'

import { useExtendedAccount } from '../hooks/useAaConnector'
import { useChain } from '../contexts/chain'


export const useNativeBalance = () => {
  const { appChain } = useChain()
  const { address } = useExtendedAccount()

  const formatBalance = useCallback((data: GetBalanceData) => ({
    rawBalance: data.value,
    balance: formatUnits(data.value, data.decimals),
  }), [])

  const { isLoading, data, error, refetch } = useBalance({
    chainId: appChain.id,
    address,
    query: {
      enabled: Boolean(address),
      select: formatBalance,
    },
  })

  return {
    loading: isLoading,
    rawBalance: data?.rawBalance,
    balance: data?.balance,
    error,
    refetch,
  }
}
