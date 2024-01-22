import { createContext, useContext, useMemo, useRef } from 'react'
import { ApolloClient, HttpLink, InMemoryCache, type NormalizedCacheObject } from '@apollo/client'
import { useChain } from '../contexts/chain'
import { graphqlEndpoints, graphqlLiveEndpoint } from '../config'

const getPrematchLink = (chainId: number) => {
  return new HttpLink({
    uri: graphqlEndpoints[chainId],
  })
}

const getPrematchApolloClient = (chainId: number) => {
  const link = getPrematchLink(chainId)
  const cache = new InMemoryCache()

  return new ApolloClient({
    link,
    ssrMode: typeof window === 'undefined',
    cache,
    connectToDevTools: true,
    assumeImmutableResults: true,
  })
}

const getLiveApolloClient = () => {
  const link = new HttpLink({
    uri: graphqlLiveEndpoint,
  })
  const cache = new InMemoryCache()

  return new ApolloClient({
    link,
    ssrMode: typeof window === 'undefined',
    cache,
    connectToDevTools: true,
    assumeImmutableResults: true,
  })
}

const apolloClients: ApolloClients = {
  prematchClient: null,
  liveClient: null,
}

export const getApolloClients = (chainId: number): ApolloClients => {
  if (typeof window === 'undefined') {
    return {
      prematchClient: getPrematchApolloClient(chainId),
      liveClient: getLiveApolloClient()
    }
  }

  if (!apolloClients.prematchClient) {
    apolloClients.prematchClient = getPrematchApolloClient(chainId)
    apolloClients.liveClient = getLiveApolloClient()
  }

  return apolloClients
}

export type ApolloClients = {
  prematchClient: ApolloClient<NormalizedCacheObject> | null
  liveClient: ApolloClient<NormalizedCacheObject> | null
}

const Context = createContext<ApolloClients | null>(null)

export const useApolloClients = () => {
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
      const { prematchClient } = apolloClientsRef.current
      const prematchLink = getPrematchLink(appChain.id)

      prematchClient!.setLink(prematchLink)
      prematchClient!.resetStore()

      prevAppChainIdRef.current = appChain.id
    }
  }, [ appChain.id ])

  return (
    <Context.Provider value={apolloClientsRef.current}>
      {children}
    </Context.Provider>
  )
}
