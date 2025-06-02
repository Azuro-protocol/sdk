import { useReadContract, type UseReadContractReturnType, type UseReadContractParameters } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { useCallback } from 'react'
import { type ChainId } from '@azuro-org/toolkit'

import { useOptionalChain } from '../contexts/chain'
import { useExtendedAccount } from '../hooks/useAaConnector'


export type UseBetTokenBalanceProps = {
  chainId?: ChainId
  query?: UseReadContractParameters<typeof erc20Abi, 'balanceOf'>['query']
}

export type UseBetTokenBalance = (props?: UseBetTokenBalanceProps) => UseReadContractReturnType<typeof erc20Abi, 'balanceOf', any, { rawBalance: BigInt, balance: string }>

export const useBetTokenBalance: UseBetTokenBalance = ({ chainId, query = {} } = {}) => {
  const { address } = useExtendedAccount()

  const { chain: appChain, betToken } = useOptionalChain(chainId)

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
      ...query,
      enabled: Boolean(address),
      select: formatBalance,
    },
  })
}
