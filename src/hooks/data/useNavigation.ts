import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import {
  PrematchGraphGameStatus,

  type NavigationQuery,
  type NavigationQueryVariables,
  NavigationDocument,
} from '@azuro-org/toolkit'

import { type SportHub } from '../../global'
import { useApolloClients } from '../../contexts/apollo'
import { getGameStartsAtValue } from '../../helpers'


type UseNavigationProps = {
  filter?: {
    sportHub?: SportHub
    sportIds?: Array<string | number>
  }
  withGameCount?: boolean
  isLive?: boolean
}

export const useNavigation = (props: UseNavigationProps = {}) => {
  const { filter, withGameCount = false, isLive } = props

  const { prematchClient, liveClient } = useApolloClients()

  const startsAt = getGameStartsAtValue()

  const options = useMemo<QueryHookOptions<NavigationQuery, NavigationQueryVariables>>(() => {
    const variables: NavigationQueryVariables = {
      first: 1000,
      withGameCount,
      sportFilter: {},
      gameFilter: {
        hasActiveConditions: true,
        status_in: [ PrematchGraphGameStatus.Created, PrematchGraphGameStatus.Paused ],
      },
    }

    if (isLive) {
      variables.gameFilter!.startsAt_lt = startsAt
    }
    else {
      variables.gameFilter!.startsAt_gt = startsAt
    }

    if (filter?.sportHub) {
      variables.sportFilter!.sporthub = filter.sportHub
    }

    if (filter?.sportIds?.length) {
      variables.sportFilter!.sportId_in = filter?.sportIds
    }

    return {
      variables,
      ssr: false,
      client: isLive ? liveClient! : prematchClient!,
      notifyOnNetworkStatusChange: true,
    }
  }, [
    withGameCount,
    startsAt,
    isLive,

    filter?.sportHub,
    filter?.sportIds?.join('-'),
  ])

  const { data, loading, error } = useQuery<NavigationQuery, NavigationQueryVariables>(NavigationDocument, options)

  return {
    navigation: data?.sports,
    loading,
    error,
  }
}
