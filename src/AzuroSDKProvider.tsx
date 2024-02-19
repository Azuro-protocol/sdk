import React from 'react'

import { ChainProvider, type ChainProviderProps } from './contexts/chain'
import { LiveProvider, type LiveProviderProps } from './contexts/live'
import { ApolloProvider } from './contexts/apollo'
import { SocketProvider } from './contexts/socket'
import { BetslipProvider } from './contexts/betslip'
import { useWatchers } from './hooks/useWatchers'


export function Watchers() {
  useWatchers()

  return null
}

type AzuroSDKProviderProps = ChainProviderProps & LiveProviderProps

export const AzuroSDKProvider: React.FC<AzuroSDKProviderProps> = ({ children, initialChainId, initialLiveState }) => {
  return (
    <SocketProvider>
      <ChainProvider initialChainId={initialChainId}>
        <LiveProvider initialLiveState={initialLiveState}>
          <ApolloProvider>
            <BetslipProvider>
              {children}
            </BetslipProvider>
          </ApolloProvider>
        </LiveProvider>
        <Watchers />
      </ChainProvider>
    </SocketProvider>
  )
}

export default AzuroSDKProvider
