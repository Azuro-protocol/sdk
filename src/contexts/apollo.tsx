import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
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

  const client = new ApolloClient({
    link,
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache({ typePolicies }),
    connectToDevTools: true,
    assumeImmutableResults: true,
  })

  // @ts-ignore
  client.chainId = chainId

  return client
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

const apolloClients: Record<number, ApolloClients> = {}

export const getApolloClients = (chainId: ChainId, prevChainId?: ChainId): ApolloClients => {
  if (typeof window === 'undefined') {
    return {
      prematchClient: getPrematchApolloClient(chainId),
      liveClient: getLiveApolloClient(chainId),
    }
  }

  if (!apolloClients[chainId]) {
    const shouldReusePrevLive = Boolean(
      prevChainId
      && apolloClients[prevChainId]?.liveClient
      && chainsData[prevChainId].graphql.live === chainsData[chainId].graphql.live
    )

    apolloClients[chainId] = {
      prematchClient: getPrematchApolloClient(chainId),
      liveClient: shouldReusePrevLive ? apolloClients[prevChainId!]!.liveClient : getLiveApolloClient(chainId),
    }
  }

  return apolloClients[chainId]
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
  const prevAppChainIdRef = useRef<ChainId>(appChain.id)

  // set new link before render for send requests with new one
  const clientsByChainId = useMemo(() => {
    const clients = getApolloClients(appChain.id, prevAppChainIdRef.current)

    prevAppChainIdRef.current = appChain.id

    return clients
  }, [ appChain.id ])

  useEffect(() => {
    // @ts-ignore
    window.__azuroSDKCurrentApolloClients = clientsByChainId
  }, [ clientsByChainId ])

  return (
    <Context.Provider value={clientsByChainId}>
      {children}
    </Context.Provider>
  )
}
