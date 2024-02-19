'use client'
import React from 'react'
import { ChainProvider } from '@azuro-org/sdk'
import { ApolloProvider } from '@azuro-org/sdk/nextjs/apollo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { polygonMumbai, arbitrumGoerli } from 'wagmi/chains'


const { wallets } = getDefaultWallets()

const config = getDefaultConfig({
  appName: 'Azuro',
  projectId: '2f82a1608c73932cfc64ff51aa38a87b', // get your own project ID - https://cloud.walletconnect.com/sign-in
  wallets,
  chains: [
    polygonMumbai,
    arbitrumGoerli,
  ]
})

const queryClient = new QueryClient()

export function Providers(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ChainProvider initialChainId={polygonMumbai.id}>
            <ApolloProvider>
              {children}
            </ApolloProvider>
          </ChainProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
