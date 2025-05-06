import React, { useState, useContext, createContext, useEffect } from 'react'
import { type Chain } from 'viem'
import { chainsData, type ChainId, type ChainData } from '@azuro-org/toolkit'
import { useQueryClient } from '@tanstack/react-query'

import { cookieKeys } from '../config'
import { useExtendedAccount, useAAWalletClient } from '../hooks/useAaConnector'


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

export type ChainProviderProps = {
  children: React.ReactNode
  initialChainId: ChainId
}

export const ChainProvider: React.FC<ChainProviderProps> = (props) => {
  const { children, initialChainId } = props

  const [ appChainId, setAppChainId ] = useState<ChainId>(initialChainId)
  const { chain: walletChain, isAAWallet } = useExtendedAccount()
  const aaWalletClient = useAAWalletClient()
  const queryClient = useQueryClient()

  const walletChainId = walletChain?.id || null

  const isRightNetwork = walletChainId === appChainId

  const { chain, contracts, betToken, graphql, socket, api, environment } = chainsData[appChainId]

  const handleChangeChain = (chainId: ChainId) => {
    document.cookie = `${cookieKeys.appChainId}=${chainId};path=/;`

    setAppChainId(chainId)
  }

  useEffect(() => {
    if (isAAWallet && aaWalletClient && aaWalletClient.chain.id !== appChainId) {
      aaWalletClient.switchChain({ id: appChainId })
    }
  }, [ isAAWallet, aaWalletClient, appChainId ])

  const context: ChainContextValue = {
    appChain: chain,
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
