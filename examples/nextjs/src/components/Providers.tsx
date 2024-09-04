'use client'
import React from 'react'
import { AzuroSDKProvider, LiveProvider } from '@azuro-org/sdk'
import { ChainId } from '@azuro-org/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { polygonAmoy, gnosis, polygon, chiliz, spicy } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'

import { BetslipProvider } from '@/context/betslip'
import { Address } from 'viem';


const { wallets } = getDefaultWallets()

const chains = [
  polygonAmoy,
  gnosis,
  polygon,
  chiliz,
  spicy,
] as const

const wagmiConfig = getDefaultConfig({
  appName: 'Azuro',
  projectId: '2f82a1608c73932cfc64ff51aa38a87b', // get your own project ID - https://cloud.walletconnect.com/sign-in
  wallets,
  chains,
  ssr: false,
})

const queryClient = new QueryClient()

type ProvidersProps = {
  children: React.ReactNode
  initialChainId?: string
  initialLiveState?: boolean
}

export function Providers(props: ProvidersProps) {
  const { children, initialChainId, initialLiveState } = props

  const chainId = initialChainId &&
                  chains.find(chain => chain.id === +initialChainId) ? +initialChainId as ChainId : polygonAmoy.id

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AzuroSDKProvider initialChainId={chainId} isBatchBetWithSameGameEnabled affiliate={process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address}>
            <BetslipProvider>
              <LiveProvider initialLiveState={initialLiveState}>
                {children}
              </LiveProvider>
            </BetslipProvider>
          </AzuroSDKProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
