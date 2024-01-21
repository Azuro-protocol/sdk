import React, { useState, useContext, createContext } from 'react'
import { type Chain, useNetwork } from 'wagmi'
import { setCookie } from 'cookies-next'
import { chainsData, type ChainId, type ChainData, cookieKeys } from '../config'


export type ChainContextValue = Omit<ChainData, 'chain'> & {
  appChain: Omit<Chain, 'id'> & { id: ChainId }
  walletChain: Chain | undefined
  isRightNetwork: boolean
  setAppChainId: (chainId: ChainId) => void
}

const ChainContext = createContext<ChainContextValue | null>(null)

export const useChain = () => {
  return useContext(ChainContext) as ChainContextValue
}

type Props = {
  children: React.ReactNode
  initialChainId: ChainId
}

export const ChainProvider: React.FC<Props> = (props) => {
  const { children, initialChainId } = props

  const [ appChainId, setAppChainId ] = useState<ChainId>(initialChainId)
  const { chain: walletChain } = useNetwork()

  const walletChainId = walletChain?.id || null

  const isRightNetwork = walletChainId === appChainId

  const { chain, contracts, betToken } = chainsData[appChainId]

  const handleChangeChain = (chainId: ChainId) => {
    setCookie(cookieKeys.appChainId, chainId)

    setAppChainId(chainId)
  }

  const context: ChainContextValue = {
    appChain: chain,
    walletChain,
    contracts,
    betToken,
    isRightNetwork,
    setAppChainId: handleChangeChain,
  }

  return (
    <ChainContext.Provider value={context}>
      {children}
    </ChainContext.Provider>
  )
}
