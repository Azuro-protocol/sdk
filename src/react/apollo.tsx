import React, { useMemo, useRef } from 'react'
import { ApolloProvider as AProvider, ApolloClient, HttpLink, InMemoryCache, type NormalizedCacheObject } from '@apollo/client'
import { graphqlEndpoints } from '../config'


const getLink = (chainId: number) => {
  return new HttpLink({
    uri: graphqlEndpoints[chainId],
  })
}

const getApolloClient = (chainId: number) => {
  const link = getLink(chainId)
  const cache = new InMemoryCache()

  return new ApolloClient({
    link,
    ssrMode: typeof window === 'undefined',
    cache,
    connectToDevTools: true,
    assumeImmutableResults: true,
  })
}

type ApolloProviderProps = {
  initialClient?: ApolloClient<NormalizedCacheObject>
  initialChainId: number
}

export const ApolloProvider = (props: React.PropsWithChildren<ApolloProviderProps>) => {
  const { children, initialClient, initialChainId } = props

  const prevAppChainIdRef = useRef<number>(initialChainId)
  const apolloClientRef = useRef<ApolloClient<NormalizedCacheObject>>(initialClient || getApolloClient(initialChainId))

  // set new link before render for send requests with new one
  useMemo(() => {
    if (initialChainId !== prevAppChainIdRef.current) {
      const link = new HttpLink({
        uri: graphqlEndpoints[initialChainId],
      })

      apolloClientRef.current.setLink(link)
      apolloClientRef.current.resetStore()

      prevAppChainIdRef.current = initialChainId
    }
  }, [ initialChainId ])

  return (
    <AProvider client={apolloClientRef.current}>
      {children}
    </AProvider>
  )
}
