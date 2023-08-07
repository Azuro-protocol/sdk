import { useMemo } from 'react'
import { type PublicClient, createPublicClient, http } from 'viem'
import { useChain } from './useChain'


export const usePublicClient = () => {
  const { appChainId, chain } = useChain()

  return useMemo<PublicClient>(() => {
    return createPublicClient({
      chain,
      transport: http(),
    })
  }, [ appChainId ])
}
