'use client'
import React from 'react'
import { ChainId, ChainProvider, LiveProvider, ApolloProvider, SocketProvider, BetslipProvider as AzuroBetslipProvider } from '@azuro-org/sdk'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { polygonMumbai, arbitrumGoerli } from 'viem/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'

import { BetslipProvider } from '@/context/betslip';


const rpcUrls: Record<number, string> = {
  [polygonMumbai.id]: 'https://rpc.ankr.com/polygon_mumbai',
  [arbitrumGoerli.id]: 'https://arbitrum-goerli.publicnode.com',
}

const { chains, publicClient } = configureChains(
  [ polygonMumbai, arbitrumGoerli ],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: rpcUrls[chain.id],
      }),
    }),
    publicProvider(),
  ]
)

const { connectors } = getDefaultWallets({
  appName: 'Azuro',
  projectId: '2f82a1608c73932cfc64ff51aa38a87b', // get your own project ID - https://cloud.walletconnect.com/sign-in
  chains,
})

const wagmiConfig = createConfig({
  connectors,
  publicClient,
})

type ProvidersProps = {
  children: React.ReactNode
  initialChainId?: string
  initialLiveState?: boolean
}

export function Providers(props: ProvidersProps) {
  const { children, initialChainId, initialLiveState } = props

  const chainId = initialChainId && rpcUrls[+initialChainId] ? +initialChainId as ChainId : polygonMumbai.id

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <ChainProvider initialChainId={chainId}>
          <LiveProvider initialState={initialLiveState}>
            <ApolloProvider>
              <SocketProvider>
                <AzuroBetslipProvider>
                  <BetslipProvider>
                    {children}
                  </BetslipProvider>
                </AzuroBetslipProvider>
              </SocketProvider>
            </ApolloProvider>
          </LiveProvider>
        </ChainProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
