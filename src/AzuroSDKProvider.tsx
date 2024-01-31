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
    <ChainProvider initialChainId={initialChainId}>
      <LiveProvider initialLiveState={initialLiveState}>
        <ApolloProvider>
          <SocketProvider>
            <BetslipProvider>
              {children}
              <Watchers />
            </BetslipProvider>
          </SocketProvider>
        </ApolloProvider>
      </LiveProvider>
    </ChainProvider>
  )
}

export default AzuroSDKProvider
