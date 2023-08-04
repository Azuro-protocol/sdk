'use client';
import { useRef } from 'react'
import { ApolloClient, ApolloLink, HttpLink, SuspenseCache } from '@apollo/client'
import { ApolloNextAppProvider, NextSSRInMemoryCache, SSRMultipartLink } from '@apollo/experimental-nextjs-app-support/ssr'
import { graphqlEndpoints } from '../config'


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

  return new ApolloClient({
    cache: new NextSSRInMemoryCache(),
    link,
  })
}

type ApolloProviderProps = {
  children: any
  appChainId: number
}

export const ApolloProvider = (props: ApolloProviderProps) => {
  const { children, appChainId } = props

  const prevAppChainIdRef = useRef<number | undefined>()
  const apolloClientRef = useRef<ApolloClient<any> | undefined>()

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

    return apolloClientRef.current as ApolloClient<any>
  }

  const makeSuspenseCache = () => {
    return new SuspenseCache()
  }

  return (
    <ApolloNextAppProvider
      makeClient={makeClient}
      makeSuspenseCache={makeSuspenseCache}
    >
      {children}
    </ApolloNextAppProvider>
  )
}
