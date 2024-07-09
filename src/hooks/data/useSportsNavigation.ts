import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import {
  PrematchGraphGameStatus,

  type SportsNavigationQuery,
  type SportsNavigationQueryVariables,
  SportsNavigationDocument } from '@azuro-org/toolkit'

import { useApolloClients } from '../../contexts/apollo'
import { getGameStartsAtValue } from '../../helpers'


type UseNavigationProps = {
  withGameCount?: boolean
  isLive?: boolean
}

export const useSportsNavigation = (props: UseNavigationProps = {}) => {
  const { withGameCount = false, isLive } = props

  const { prematchClient, liveClient } = useApolloClients()

  const startsAt = getGameStartsAtValue()

  const options = useMemo<QueryHookOptions<SportsNavigationQuery, SportsNavigationQueryVariables>>(() => {
    const variables: SportsNavigationQueryVariables = {
      first: 1000,
      withGameCount,
      where: {
        hasActiveConditions: true,
        status_in: [ PrematchGraphGameStatus.Created, PrematchGraphGameStatus.Paused ],
      },
    }

    if (isLive) {
      variables.where!.startsAt_lt = startsAt
    }
    else {
      variables.where!.startsAt_gt = startsAt
    }

    return {
      variables,
      ssr: false,
      client: isLive ? liveClient! : prematchClient!,
      notifyOnNetworkStatusChange: true,
    }
  }, [ withGameCount, startsAt, isLive ])

  const { data, loading, error } = useQuery<SportsNavigationQuery, SportsNavigationQueryVariables>(SportsNavigationDocument, options)

  return {
    sports: data?.sports,
    loading,
    error,
  }
}
