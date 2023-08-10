import { useMemo, useRef } from 'react'
import { ApolloProvider as AProvider, ApolloClient, HttpLink, InMemoryCache, type NormalizedCacheObject } from '@apollo/client'
import { useChain } from '../contexts/chain'
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

type Props = {
  children: any
  initialClient?: ApolloClient<NormalizedCacheObject>
}

export const ApolloProvider = (props: Props) => {
  const { children, initialClient } = props

  const { appChain } = useChain()
  const prevAppChainIdRef = useRef<number>(appChain.id)
  const apolloClientRef = useRef<ApolloClient<NormalizedCacheObject>>(initialClient || getApolloClient(appChain.id))

  // set new link before render for send requests with new one
  useMemo(() => {
    if (appChain.id !== prevAppChainIdRef.current) {
      const link = new HttpLink({
        uri: graphqlEndpoints[appChain.id],
      })

      apolloClientRef.current.setLink(link)
      apolloClientRef.current.resetStore()

      prevAppChainIdRef.current = appChain.id
    }
  }, [ appChain.id ])

  return (
    <AProvider client={apolloClientRef.current}>
      {children}
    </AProvider>
  )
}
