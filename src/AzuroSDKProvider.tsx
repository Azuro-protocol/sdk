import React from 'react';

import { ChainProvider, ChainProviderProps } from './contexts/chain';
import { LiveProvider, LiveProviderProps } from './contexts/live';
import { ApolloProvider } from './contexts/apollo';
import { SocketProvider } from './contexts/socket';
import { BetslipProvider } from './contexts/betslip';

type AzuroSDKProviderProps = ChainProviderProps & LiveProviderProps

export const AzuroSDKProvider: React.FC<AzuroSDKProviderProps> = ({ children, initialChainId, initialLiveState }) => {
  return (
    <ChainProvider initialChainId={initialChainId}>
      <LiveProvider initialLiveState={initialLiveState}>
        <ApolloProvider>
          <SocketProvider>
            <BetslipProvider>
                {children}
            </BetslipProvider>
          </SocketProvider>
        </ApolloProvider>
      </LiveProvider>
    </ChainProvider>
  );
};

export default AzuroSDKProvider
