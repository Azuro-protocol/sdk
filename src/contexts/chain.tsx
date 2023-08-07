import React, { useRef, useState, createContext } from 'react'
import { useNetwork } from 'wagmi'
import { chainsData, type ChainId, type ChainData } from '../config'


export type ChainContextValue = ChainData & {
  walletChainId: number | null
  appChainId: number
  isRightNetwork: boolean
}

export const ChainContext = createContext<ChainContextValue | null>(null)

type Props = {
  children: React.ReactNode
  initialChainId: ChainId
}

export const ChainProvider: React.FC<Props> = (props) => {
  const { children, initialChainId } = props

  const walletNetwork = useNetwork()
  const [ appChainId, setSelectedChainId ] = useState<ChainId>(initialChainId)

  const walletChainId = walletNetwork.chain?.id || null
  const isRightNetwork = walletChainId === appChainId

  const appChainIdRef = useRef<number | null>(null)
  appChainIdRef.current = appChainId

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
