import React, { useMemo, useRef } from 'react'
import { ApolloProvider as AProvider } from '@apollo/client'
import { type NormalizedCacheObject } from '@apollo/client/cache'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core'
import { graphqlEndpoints } from './config'


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
  appChainId: number
}

export const ApolloProvider = (props: React.PropsWithChildren<ApolloProviderProps>) => {
  const { children, initialClient, appChainId } = props

  const prevAppChainIdRef = useRef<number>(appChainId)
  const apolloClientRef = useRef<ApolloClient<NormalizedCacheObject>>(initialClient || getApolloClient(appChainId))

  // set new link before render for send requests with new one
  useMemo(() => {
    if (appChainId !== prevAppChainIdRef.current) {
      const link = new HttpLink({
        uri: graphqlEndpoints[appChainId],
      })

      apolloClientRef.current.setLink(link)
      apolloClientRef.current.resetStore()

      prevAppChainIdRef.current = appChainId
    }
  }, [ appChainId ])

  return (
    <AProvider client={apolloClientRef.current}>
      {children}
    </AProvider>
  )
}
