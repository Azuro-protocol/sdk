'use client'
import React from 'react'
import { ChainProvider } from '@azuro-org/sdk'
import { ApolloProvider } from '@azuro-org/sdk/nextjs/apollo'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { polygonMumbai, arbitrumGoerli } from 'viem/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'


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

export function Providers(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider initialChain={polygonMumbai} chains={chains}>
        <ChainProvider initialChainId={polygonMumbai.id}>
          <ApolloProvider>
            {children}
          </ApolloProvider>
        </ChainProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
