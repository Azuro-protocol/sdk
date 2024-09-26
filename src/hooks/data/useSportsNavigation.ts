import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import {
  PrematchGraphGameStatus,

  type SportsNavigationQuery,
  type SportsNavigationQueryVariables,
  SportsNavigationDocument } from '@azuro-org/toolkit'

import { type SportHub } from '../../global'
import { useApolloClients } from '../../contexts/apollo'
import { getGameStartsAtValue } from '../../helpers'


type UseNavigationProps = {
  filter?: {
    sportHub?: SportHub
  }
  withGameCount?: boolean
  isLive?: boolean
}

export const useSportsNavigation = (props: UseNavigationProps = {}) => {
  const { filter, withGameCount = false, isLive } = props

  const { prematchClient, liveClient } = useApolloClients()

  const startsAt = getGameStartsAtValue()

  const options = useMemo<QueryHookOptions<SportsNavigationQuery, SportsNavigationQueryVariables>>(() => {
    const variables: SportsNavigationQueryVariables = {
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

    return {
      variables,
      ssr: false,
      client: isLive ? liveClient! : prematchClient!,
      notifyOnNetworkStatusChange: true,
    }
  }, [ withGameCount, startsAt, isLive, filter?.sportHub ])

  const { data, loading, error } = useQuery<SportsNavigationQuery, SportsNavigationQueryVariables>(SportsNavigationDocument, options)

  return {
    sports: data?.sports,
    loading,
    error,
  }
}
