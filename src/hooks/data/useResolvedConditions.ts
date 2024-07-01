import { useMemo } from 'react'
import { useQuery } from '@apollo/client'

import { liveSupportedChains } from 'src/config'

import {
  ConditionsDocument as PrematchConditionsDocument,
  type ConditionsQuery as PrematchConditionsQuery,
  type ConditionsQueryVariables as PrematchConditionsQueryVariables,
} from '../../docs/prematch/conditions'
import {
  ConditionsDocument as LiveConditionsDocument,
  type ConditionsQuery as LiveConditionsQuery,
  type ConditionsQueryVariables as LiveConditionsQueryVariables,
} from '../../docs/live/conditions'
import { ConditionStatus } from '../../docs/prematch/types'
import { useApolloClients } from '../../contexts/apollo'
import { useChain } from '../../contexts/chain'


export type ConditionsQuery = PrematchConditionsQuery | LiveConditionsQuery

type UseConditionsProps = {
  gameId: string | bigint
}

export const useResolvedConditions = (props: UseConditionsProps) => {
  const { gameId } = props
  const { prematchClient, liveClient } = useApolloClients()
  const { appChain } = useChain()

  const variables = useMemo<PrematchConditionsQueryVariables | LiveConditionsQueryVariables>(() => {
    const vars: PrematchConditionsQueryVariables | LiveConditionsQueryVariables = {
      where: {
        game_: {
          gameId,
        },
        status: ConditionStatus.Resolved,
      },
    }

    return vars
  }, [ gameId ])

  const {
    data: prematchData,
    loading: isPrematchLoading,
    error: prematchError,
  } = useQuery<PrematchConditionsQuery, PrematchConditionsQueryVariables>(PrematchConditionsDocument, {
    variables: variables as PrematchConditionsQueryVariables,
    ssr: false,
    client: prematchClient!,
    notifyOnNetworkStatusChange: true,
  })
  const {
    data: liveData,
    loading: isLiveLoading,
    error: liveError,
  } = useQuery<LiveConditionsQuery, LiveConditionsQueryVariables>(LiveConditionsDocument, {
    variables: variables as LiveConditionsQueryVariables,
    ssr: false,
    client: liveClient!,
    skip: !liveSupportedChains.includes(appChain.id),
  })

  return {
    prematchConditions: prematchData?.conditions,
    liveConditions: liveData?.conditions,
    loading: isPrematchLoading || isLiveLoading,
    error: prematchError || liveError,
  }
}
