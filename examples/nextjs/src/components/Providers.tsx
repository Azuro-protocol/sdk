'use client'
import React from 'react'
import { ChainProvider } from '@azuro-org/sdk'
import { ApolloProvider } from '@azuro-org/sdk/nextjs/apollo'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { mainnet, polygonMumbai } from 'viem/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'


const rpcUrls: Record<number, string> = {
  [mainnet.id]: 'https://rpc.ankr.com/eth',
  [polygonMumbai.id]: 'https://rpc.ankr.com/polygon_mumbai',
}

const { chains, publicClient } = configureChains(
  // we need mainnet here because walletconnect will not connect if wallet has no required chain in network list -
  // we can request adding a chain to a wallet only after connection, so we must connect to mainnet :(
  [ mainnet, polygonMumbai ],
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
  projectId: '2f82a1608c73932cfc64ff51aa38a87b',
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
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
