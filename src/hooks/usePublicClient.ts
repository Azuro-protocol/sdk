import { useMemo } from 'react'
import { type PublicClient, createPublicClient, http } from 'viem'
import { useChain } from '../contexts/chain'


export const usePublicClient = (): PublicClient => {
  const { appChain } = useChain()

  return useMemo(() => {
    return createPublicClient({
      chain: appChain,
      transport: http(),
    })
  }, [ appChain.id ])
}
