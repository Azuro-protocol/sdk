'use client';
import { useRef } from 'react'
import { ApolloLink, HttpLink } from '@apollo/client'
import { ApolloNextAppProvider, NextSSRInMemoryCache, NextSSRApolloClient, SSRMultipartLink } from '@apollo/experimental-nextjs-app-support/ssr'
import { useChain } from 'chain-context'
import { graphqlEndpoints } from 'config'


const getLink = (chainId: number) => {
  return new HttpLink({
    uri: graphqlEndpoints[chainId],
  })
}

const getApolloClient = (chainId: number) => {
  const httpLink = getLink(chainId)

  let link: ApolloLink = httpLink

  if (typeof window === 'undefined') {
    link = ApolloLink.from([
      new SSRMultipartLink({
        stripDefer: true,
      }),
      httpLink,
    ])
  }

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link,
  })
}

export const ApolloProvider = (props: { children: any }) => {
  const { children } = props

  const { appChainId } = useChain()
  const prevAppChainIdRef = useRef<number | undefined>()
  const apolloClientRef = useRef<NextSSRApolloClient<any> | undefined>()

  const makeClient = () => {
    if (appChainId !== prevAppChainIdRef.current) {
      if (!apolloClientRef.current) {
        apolloClientRef.current = getApolloClient(appChainId)
      }
      else {
        const link = new HttpLink({
          uri: graphqlEndpoints[appChainId],
        })

        apolloClientRef.current.setLink(link)
        apolloClientRef.current.resetStore()
      }

      prevAppChainIdRef.current = appChainId
    }

    return apolloClientRef.current as NextSSRApolloClient<any>
  }

  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  )
}
