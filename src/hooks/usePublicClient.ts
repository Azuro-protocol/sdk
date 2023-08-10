import { useMemo } from 'react'
import { type PublicClient, createPublicClient, http } from 'viem'
import { useChain } from 'chain-context'


export const usePublicClient = (): PublicClient => {
  const { appChainId, chain } = useChain()

  return useMemo(() => {
    return createPublicClient({
      chain,
      transport: http(),
    })
  }, [ appChainId ])
}
