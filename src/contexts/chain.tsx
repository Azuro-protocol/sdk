import React, { useState, useContext, createContext, use } from 'react'
import { type Chain } from 'viem'
import { chainsData, type ChainId, type ChainData } from '@azuro-org/toolkit'

import { cookieKeys } from '../config'
import { useExtendedAccount } from '../hooks/useAaConnector'


export type ChainContextValue = ChainData & {
  appChain: Omit<Chain, 'id'> & { id: ChainId }
  walletChain: Chain | undefined
  isRightNetwork: boolean
  setAppChainId: (chainId: ChainId) => void
}

export const ChainContext = createContext<ChainContextValue | null>(null)

export const useChain = () => {
  return useContext(ChainContext) as ChainContextValue
}

export const useOptionalChain = (chainId?: ChainId) => {
  let chainData = chainId ? chainsData[chainId] : use(ChainContext)

  if (!chainData) {
    throw new Error('Please provide chainId or use ChainProvider')
  }

  return chainData
}

export type ChainProviderProps = {
  children: React.ReactNode
  initialChainId: ChainId
}

export const ChainProvider: React.FC<ChainProviderProps> = (props) => {
  const { children, initialChainId } = props

  const [ appChainId, setAppChainId ] = useState<ChainId>(initialChainId)
  const { chain: walletChain } = useExtendedAccount()

  const walletChainId = walletChain?.id || null

  const isRightNetwork = walletChainId === appChainId

  const { chain, contracts, betToken, graphql, socket, api, environment } = chainsData[appChainId]

  const handleChangeChain = (chainId: ChainId) => {
    document.cookie = `${cookieKeys.appChainId}=${chainId};path=/;`

    setAppChainId(chainId)
  }

  const context: ChainContextValue = {
    appChain: chain,
    chain,
    walletChain,
    contracts,
    betToken,
    graphql,
    socket,
    api,
    environment,
    isRightNetwork,
    setAppChainId: handleChangeChain,
  }

  return (
    <ChainContext.Provider value={context}>
      {children}
    </ChainContext.Provider>
  )
}
