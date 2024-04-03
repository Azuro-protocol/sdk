import { createContext, useContext, useMemo, useRef } from 'react'
import { ApolloClient, HttpLink, InMemoryCache, type NormalizedCacheObject } from '@apollo/client'

import { useChain } from '../contexts/chain'
import { type ChainId, chainsData } from '../config'


const getPrematchLink = (chainId: ChainId) => {
  return new HttpLink({
    uri: ({ operationName }) => `${chainsData[chainId].graphql.prematch}?op=${operationName}`,
  })
}
const getLiveLink = (chainId: ChainId) => {
  return new HttpLink({
    uri: ({ operationName }) => `${chainsData[chainId].graphql.live}?op=${operationName}`,
  })
}

const getPrematchApolloClient = (chainId: ChainId) => {
  const link = getPrematchLink(chainId)

  return new ApolloClient({
    link,
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    connectToDevTools: true,
    assumeImmutableResults: true,
  })
}

const getLiveApolloClient = (chainId: ChainId) => {
  const link = getLiveLink(chainId)

  return new ApolloClient({
    link,
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    connectToDevTools: true,
    assumeImmutableResults: true,
  })
}

const apolloClients: ApolloClients = {
  prematchClient: null,
  liveClient: null,
}

export const getApolloClients = (chainId: ChainId): ApolloClients => {
  if (typeof window === 'undefined') {
    return {
      prematchClient: getPrematchApolloClient(chainId),
      liveClient: getLiveApolloClient(chainId),
    }
  }

  if (!apolloClients.prematchClient) {
    apolloClients.prematchClient = getPrematchApolloClient(chainId)
    apolloClients.liveClient = getLiveApolloClient(chainId)
  }

  return apolloClients
}

export type ApolloClients = {
  prematchClient: ApolloClient<NormalizedCacheObject> | null
  liveClient: ApolloClient<NormalizedCacheObject> | null
}

const Context = createContext<ApolloClients | null>(null)

export const useApolloClients = (): ApolloClients => {
  return useContext(Context) as ApolloClients
}

type Props = {
  children: any
}

export const ApolloProvider = (props: Props) => {
  const { children } = props

  const { appChain } = useChain()
  const prevAppChainIdRef = useRef<number>(appChain.id)
  const apolloClientsRef = useRef<ApolloClients>(getApolloClients(appChain.id))

  // set new link before render for send requests with new one
  useMemo(() => {
    if (appChain.id !== prevAppChainIdRef.current) {
      const { prematchClient, liveClient } = apolloClientsRef.current

      const prematchLink = getPrematchLink(appChain.id)
      const liveLink = getLiveLink(appChain.id)

      prematchClient!.setLink(prematchLink)
      prematchClient!.resetStore()

      liveClient!.setLink(liveLink)
      liveClient!.resetStore()

      prevAppChainIdRef.current = appChain.id
    }
  }, [ appChain.id ])

  return (
    <Context.Provider value={apolloClientsRef.current}>
      {children}
    </Context.Provider>
  )
}
