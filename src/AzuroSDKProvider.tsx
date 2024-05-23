import React from 'react'

import { ChainProvider, type ChainProviderProps } from './contexts/chain'
import { ApolloProvider } from './contexts/apollo'
import { SocketProvider } from './contexts/socket'
import { BetslipProvider, type BetslipProviderProps } from './contexts/betslip'
import { useWatchers } from './hooks/useWatchers'


export function Watchers() {
  useWatchers()

  return null
}

type AzuroSDKProviderProps = ChainProviderProps & BetslipProviderProps

export const AzuroSDKProvider: React.FC<AzuroSDKProviderProps> = ({ children, initialChainId, isBatchBetWithSameGameEnabled }) => {
  return (
    <ChainProvider initialChainId={initialChainId}>
      <SocketProvider>
        <ApolloProvider>
          <BetslipProvider isBatchBetWithSameGameEnabled={isBatchBetWithSameGameEnabled}>
            {children}
          </BetslipProvider>
        </ApolloProvider>
        <Watchers />
      </SocketProvider>
    </ChainProvider>
  )
}

export default AzuroSDKProvider
