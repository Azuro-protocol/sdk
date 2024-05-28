import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'

import type { NavigationQuery, NavigationQueryVariables } from '../docs/prematch/navigation'
import { NavigationDocument } from '../docs/prematch/navigation'
import { useApolloClients } from '../contexts/apollo'
import { getGameStartsAtValue } from '../helpers'
import { GameStatus } from '../docs/prematch/types'


type UseNavigationProps = {
  withGameCount?: boolean
  isLive?: boolean
}

export const useSportsNavigation = (props: UseNavigationProps = {}) => {
  const { withGameCount = false, isLive } = props

  const { prematchClient, liveClient } = useApolloClients()

  const startsAt = getGameStartsAtValue()

  const options = useMemo<QueryHookOptions<NavigationQuery, NavigationQueryVariables>>(() => {
    const variables: NavigationQueryVariables = {
      first: 1000,
      withGameCount,
      where: {
        hasActiveConditions: true,
        status_in: [ GameStatus.Created, GameStatus.Paused ],
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

  const { data, loading, error } = useQuery<NavigationQuery, NavigationQueryVariables>(NavigationDocument, options)

  return {
    sports: data?.sports,
    loading,
    error,
  }
}
