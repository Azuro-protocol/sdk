import React, { useRef, useContext, createContext } from 'react'
import { useNetwork } from 'wagmi'
import { chainsData, type ChainId, type ChainData } from 'config'


const availableChainIds = Object.keys(chainsData).map(Number)

export type ChainContextValue = ChainData & {
  walletChainId: number | null
  appChainId: ChainId
  isRightNetwork: boolean
}

export const ChainContext = createContext<ChainContextValue | null>(null)

type Props = {
  children: React.ReactNode
  initialChainId: ChainId
}

export const ChainProvider: React.FC<Props> = (props) => {
  const { children, initialChainId } = props

  const appChainIdRef = useRef<number>(initialChainId)
  const walletNetwork = useNetwork()

  const walletChainId = walletNetwork.chain?.id || null

  if (walletChainId && availableChainIds.includes(walletChainId)) {
    appChainIdRef.current = walletChainId
  }

  const appChainId = appChainIdRef.current as unknown as ChainId
  const isRightNetwork = walletChainId === appChainId

  const { chain, contracts, betToken } = chainsData[appChainId]

  const context: ChainContextValue = {
    chain,
    contracts,
    betToken,
    walletChainId,
    appChainId,
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
