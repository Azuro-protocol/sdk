import React from 'react'

import { ChainProvider, type ChainProviderProps } from './contexts/chain'
import { FeedSocketProvider } from './contexts/feedSocket'
import { ConditionUpdatesProvider } from './contexts/conditionUpdates'
import { LiveStatisticsSocketProvider } from './contexts/liveStatisticsSocket'
import { BetslipProvider, type BetslipProviderProps } from './contexts/betslip'
import { GameUpdatesProvider } from './contexts/gameUpdates'


type AzuroSDKProviderProps = ChainProviderProps & BetslipProviderProps

export const AzuroSDKProvider: React.FC<AzuroSDKProviderProps> = (props) => {
  const { children, initialChainId, affiliate, isBatchBetWithSameGameEnabled } = props

  return (
    <ChainProvider initialChainId={initialChainId}>
      <FeedSocketProvider>
        <GameUpdatesProvider>
          <ConditionUpdatesProvider>
            <LiveStatisticsSocketProvider>
              <BetslipProvider
                isBatchBetWithSameGameEnabled={isBatchBetWithSameGameEnabled}
                affiliate={affiliate}
              >
                {children}
              </BetslipProvider>
            </LiveStatisticsSocketProvider>
          </ConditionUpdatesProvider>
        </GameUpdatesProvider>
      </FeedSocketProvider>
    </ChainProvider>
  )
}

export default AzuroSDKProvider
