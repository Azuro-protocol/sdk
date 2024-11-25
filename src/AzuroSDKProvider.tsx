import React from 'react'

import { ChainProvider, type ChainProviderProps } from './contexts/chain'
import { ApolloProvider } from './contexts/apollo'
import { OddsSocketProvider } from './contexts/oddsSocket'
import { BetslipProvider, type BetslipProviderProps } from './contexts/betslip'
import { useWatchers } from './hooks/watch/useWatchers'


export function Watchers() {
  useWatchers()

  return null
}

type AzuroSDKProviderProps = ChainProviderProps & BetslipProviderProps

export const AzuroSDKProvider: React.FC<AzuroSDKProviderProps> = (props) => {
  const { children, initialChainId, affiliate, isBatchBetWithSameGameEnabled } = props

  return (
    <ChainProvider initialChainId={initialChainId}>
      <OddsSocketProvider>
        <ApolloProvider>
          <BetslipProvider
            isBatchBetWithSameGameEnabled={isBatchBetWithSameGameEnabled}
            affiliate={affiliate}
          >
            {children}
          </BetslipProvider>
        </ApolloProvider>
        <Watchers />
      </OddsSocketProvider>
    </ChainProvider>
  )
}

export default AzuroSDKProvider
