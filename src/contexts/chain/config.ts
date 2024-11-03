import type { ChainData, ChainId } from '@azuro-org/toolkit'
import type { Chain } from 'viem'
import { createContext } from 'react'


export type ChainContextValue = Omit<ChainData, 'chain'> & {
  appChain: Omit<Chain, 'id'> & { id: ChainId }
  walletChain: Chain | undefined
  isRightNetwork: boolean
  setAppChainId: (chainId: ChainId) => void
}

export const ChainContext = createContext<ChainContextValue | null>(null)
