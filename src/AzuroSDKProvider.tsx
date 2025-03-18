import React from 'react'

import { ChainProvider, type ChainProviderProps } from './contexts/chain'
import { OddsSocketProvider } from './contexts/oddsSocket'
import { LiveStatisticsSocketProvider } from './contexts/liveStatisticsSocket'
import { BetslipProvider, type BetslipProviderProps } from './contexts/betslip'


type AzuroSDKProviderProps = ChainProviderProps & BetslipProviderProps

export const AzuroSDKProvider: React.FC<AzuroSDKProviderProps> = (props) => {
  const { children, initialChainId, affiliate, isBatchBetWithSameGameEnabled } = props

  return (
    <ChainProvider initialChainId={initialChainId}>
      <OddsSocketProvider>
        <LiveStatisticsSocketProvider>
          <BetslipProvider
            isBatchBetWithSameGameEnabled={isBatchBetWithSameGameEnabled}
            affiliate={affiliate}
          >
            {children}
          </BetslipProvider>
        </LiveStatisticsSocketProvider>
      </OddsSocketProvider>
    </ChainProvider>
  )
}

export default AzuroSDKProvider
