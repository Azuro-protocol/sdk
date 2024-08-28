import { createContext, useContext, useMemo, useRef } from 'react'
import { ApolloClient, HttpLink, InMemoryCache, type NormalizedCacheObject, type TypePolicies } from '@apollo/client'
import { type ChainId, chainsData } from '@azuro-org/toolkit'

import { useChain } from '../contexts/chain'


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

const typePolicies: TypePolicies = {
  Query: {
    fields: {
      bets: {
        merge(existing, incoming, { args }) {

          // in case of fetching first paginated portion, we should drop cache to avoid data mismatch/shifting
          if (!args?.skip || !existing?.length) {
            return incoming
          }

          return [ ...(existing || []), ...incoming ]
        },
      },
      liveBets: {
        merge(existing, incoming, { args }) {

          // in case of fetching first paginated portion, we should drop cache to avoid data mismatch/shifting
          if (!args?.skip || !existing?.length) {
            return incoming
          }

          return [ ...(existing || []), ...incoming ]
        },
      },
    },
  },
}

const getPrematchApolloClient = (chainId: ChainId) => {
  const link = getPrematchLink(chainId)

  return new ApolloClient({
    link,
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache({ typePolicies }),
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
  prematchClient: null as any,
  liveClient: null as any,
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
  prematchClient: ApolloClient<NormalizedCacheObject>
  liveClient: ApolloClient<NormalizedCacheObject>
}

const Context = createContext<ApolloClients>(null as any)

export const useApolloClients = (): ApolloClients => {
  return useContext(Context) as ApolloClients
}

type Props = {
  children: any
}

export const ApolloProvider = (props: Props) => {
  const { children } = props

  const { appChain } = useChain()
  const prevAppChainIdRef = useRef(appChain.id)
  const apolloClientsRef = useRef<ApolloClients>(getApolloClients(appChain.id))

  // set new link before render for send requests with new one
  useMemo(() => {
    if (appChain.id !== prevAppChainIdRef.current) {
      const { prematchClient, liveClient } = apolloClientsRef.current

      const prematchLink = getPrematchLink(appChain.id)

      prematchClient!.setLink(prematchLink)
      prematchClient!.resetStore()

      if (chainsData[prevAppChainIdRef.current].graphql.live !== chainsData[appChain.id].graphql.live) {
        const liveLink = getLiveLink(appChain.id)

        liveClient!.setLink(liveLink)
        liveClient!.resetStore()
      }

      prevAppChainIdRef.current = appChain.id
    }
  }, [ appChain.id ])

  return (
    <Context.Provider value={apolloClientsRef.current}>
      {children}
    </Context.Provider>
  )
}
