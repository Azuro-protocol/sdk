import React from 'react'

import { ChainProvider, type ChainProviderProps } from './contexts/chain'
import { ApolloProvider } from './contexts/apollo'
import { SocketProvider } from './contexts/socket'
import { BetslipProvider } from './contexts/betslip'
import { useWatchers } from './hooks/useWatchers'


export function Watchers() {
  useWatchers()

  return null
}

type AzuroSDKProviderProps = ChainProviderProps

export const AzuroSDKProvider: React.FC<AzuroSDKProviderProps> = ({ children, initialChainId }) => {
  return (
    <ChainProvider initialChainId={initialChainId}>
      <SocketProvider>
        <ApolloProvider>
          <BetslipProvider>
            {children}
          </BetslipProvider>
        </ApolloProvider>
        <Watchers />
      </SocketProvider>
    </ChainProvider>
  )
}

export default AzuroSDKProvider
