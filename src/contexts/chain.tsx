import React, { useRef, useContext, createContext } from 'react'
import { type Chain, useNetwork } from 'wagmi'
import { chainsData, type ChainId, type ChainData } from '../config'


export type ChainContextValue = Omit<ChainData, 'chain'> & {
  appChain: Omit<Chain, 'id'> & { id: ChainId }
  walletChain: Chain | undefined
  isRightNetwork: boolean
}

const ChainContext = createContext<ChainContextValue | null>(null)

type Props = {
  children: React.ReactNode
  initialChainId: ChainId
}

export const ChainProvider: React.FC<Props> = (props) => {
  const { children, initialChainId } = props

  const appChainIdRef = useRef<number>(initialChainId)
  const { chain: walletChain, chains } = useNetwork()

  const availableChainIds = chains.map(({ id }) => id)
  const walletChainId = walletChain?.id || null

  if (walletChainId && availableChainIds.includes(walletChainId)) {
    appChainIdRef.current = walletChainId
  }

  const appChainId = appChainIdRef.current as unknown as ChainId
  const isRightNetwork = walletChainId === appChainId

  const { chain, contracts, betToken } = chainsData[appChainId]

  // TODO add "setChain" logic - added on 10/23/23 by pavelivanov
  const context: ChainContextValue = {
    appChain: chain,
    walletChain,
    contracts,
    betToken,
    isRightNetwork,
  }

  return (
    <ChainContext.Provider value={context}>
      {children}
    </ChainContext.Provider>
  )
}

export const useChain = () => {
  return useContext(ChainContext) as ChainContextValue
}
