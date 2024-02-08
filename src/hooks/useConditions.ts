import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { polygonMumbai } from 'viem/chains'

import {
  ConditionsDocument as PrematchConditionsDocument,
  type ConditionsQuery as PrematchConditionsQuery,
  type ConditionsQueryVariables as PrematchConditionsQueryVariables,
} from '../docs/prematch/conditions'
import {
  ConditionsDocument as LiveConditionsDocument,
  type ConditionsQuery as LiveConditionsQuery,
  type ConditionsQueryVariables as LiveConditionsQueryVariables,
} from '../docs/live/conditions'
import { useApolloClients } from '../contexts/apollo'
import { useChain } from '../contexts/chain'


export type ConditionsQuery = PrematchConditionsQuery | LiveConditionsQuery

type UseConditionsProps = {
  gameId: string | bigint
  isLive: boolean
  livePollInterval?: number
  filter?: {
    outcomeIds?: string[]
  }
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameId, isLive, livePollInterval, filter } = props
  const { prematchClient, liveClient } = useApolloClients()
  const { appChain } = useChain()

  const variables = useMemo<PrematchConditionsQueryVariables>(() => {
    const vars: PrematchConditionsQueryVariables = {
      where: {
        game_: {
          gameId,
        },
      },
    }

    if (filter?.outcomeIds) {
      vars.where.outcomesIds_contains = filter.outcomeIds
    }

    return vars
  }, [ gameId, filter?.outcomeIds?.join(',') ])

  const {
    data: prematchData,
    loading: isPrematchLoading,
    error: prematchError,
  } = useQuery<PrematchConditionsQuery, PrematchConditionsQueryVariables>(PrematchConditionsDocument, {
    variables,
    ssr: false,
    client: prematchClient!,
    skip: isLive,
    notifyOnNetworkStatusChange: true,
  })
  const {
    data: liveData,
    loading: isLiveLoading,
    error: liveError,
  } = useQuery<LiveConditionsQuery, LiveConditionsQueryVariables>(LiveConditionsDocument, {
    variables,
    ssr: false,
    client: liveClient!,
    skip: !isLive || appChain.id !== polygonMumbai.id,
    pollInterval: livePollInterval,
  })

  const data = (isLive ? liveData : prematchData) || {} as ConditionsQuery

  return {
    conditions: data?.conditions,
    loading: isPrematchLoading || isLiveLoading,
    error: prematchError || liveError,
  }
}
