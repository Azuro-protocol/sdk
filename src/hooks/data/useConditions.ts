import { useMemo } from 'react'
import { type FetchPolicy, useQuery } from '@apollo/client'
import {
  type Condition_Filter,

  type PrematchConditionsQuery,
  type PrematchConditionsQueryVariables,
  PrematchConditionsDocument,

  type LiveConditionsQuery,
  type LiveConditionsQueryVariables,
  LiveConditionsDocument,
} from '@azuro-org/toolkit'

import { useApolloClients } from '../../contexts/apollo'
import { useChain } from '../../contexts/chain'


type QueryProps = {
  pollInterval?: number
  skip?: boolean
  fetchPolicy?: FetchPolicy
}

type UseConditionsProps = {
  gameId: string | bigint
  filter?: Condition_Filter
  prematchQuery?: QueryProps
  liveQuery?: QueryProps
}

const defaultQueryProps: QueryProps = {
  pollInterval: undefined,
  skip: false,
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameId, filter, prematchQuery = defaultQueryProps, liveQuery = defaultQueryProps } = props
  const { prematchClient, liveClient } = useApolloClients()
  const { contracts } = useChain()

  const variables = useMemo<PrematchConditionsQueryVariables | LiveConditionsQueryVariables>(() => {
    const vars: PrematchConditionsQueryVariables | LiveConditionsQueryVariables = {
      where: {
        game_: {
          gameId,
        },
        ...(filter || {}),
      },
    }

    return vars
  }, [ gameId, filter ])

  const {
    data: prematchData,
    loading: isPrematchLoading,
    error: prematchError,
  } = useQuery<PrematchConditionsQuery, PrematchConditionsQueryVariables>(PrematchConditionsDocument, {
    variables: variables as PrematchConditionsQueryVariables,
    ssr: false,
    client: prematchClient!,
    notifyOnNetworkStatusChange: true,
    ...prematchQuery,
  })
  const {
    data: liveData,
    loading: isLiveLoading,
    error: liveError,
  } = useQuery<LiveConditionsQuery, LiveConditionsQueryVariables>(LiveConditionsDocument, {
    variables: variables as LiveConditionsQueryVariables,
    ssr: false,
    client: liveClient!,
    ...liveQuery,
    skip: liveQuery.skip || !contracts.liveCore,
  })

  return {
    prematchConditions: prematchData?.conditions,
    liveConditions: liveData?.conditions,
    loading: isPrematchLoading || isLiveLoading,
    error: prematchError || liveError,
  }
}
