import { useReadContract } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { useCallback } from 'react'

import { useChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'


export const useBetTokenBalance = () => {
  const { appChain, betToken } = useChain()
  const { address } = useExtendedAccount()

  const formatBalance = useCallback((rawBalance: bigint) => ({
    rawBalance,
    balance: formatUnits(rawBalance, betToken.decimals),
  }), [ betToken.decimals ])

  return useReadContract({
    address: betToken.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    chainId: appChain.id,
    args: [ address! ],
    query: {
      enabled: Boolean(address),
      select: formatBalance,
    },
  })
}
