import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'

import type { NavigationQuery, NavigationQueryVariables } from '../docs/prematch/navigation'
import { NavigationDocument } from '../docs/prematch/navigation'
import { useApolloClients } from '../contexts/apollo'
import { useLive } from '../contexts/live'
import { getGameStartsAtGtValue } from '../helpers'
import { GameStatus } from '../docs/prematch/types'


type UseNavigationProps = {
  withGameCount?: boolean
}

export const useSportsNavigation = (props: UseNavigationProps = {}) => {
  const { withGameCount = false } = props

  const { prematchClient, liveClient } = useApolloClients()
  const { isLive } = useLive()

  const startsAt_gt = getGameStartsAtGtValue()

  const options = useMemo<QueryHookOptions<NavigationQuery, NavigationQueryVariables>>(() => {
    const variables: NavigationQueryVariables = {
      withGameCount,
      where: {
        hasActiveConditions: true,
        status_in: [ GameStatus.Created, GameStatus.Paused ],
      },
    }

    if (isLive) {
      variables.where!.startsAt_lt = startsAt_gt
    }
    else {
      variables.where!.startsAt_gt = startsAt_gt
    }

    return {
      variables,
      ssr: false,
      client: isLive ? liveClient! : prematchClient!,
    }
  }, [ withGameCount, startsAt_gt, isLive ])

  return useQuery<NavigationQuery, NavigationQueryVariables>(NavigationDocument, options)
}
