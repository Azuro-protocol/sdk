import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { NavigationDocument, NavigationQuery, NavigationQueryVariables } from '../docs/navigation'
import { GameStatus } from '../types'
import { getGameStartsAtGtValue } from '../helpers'


type UseNavigationProps = {
  withGameCount?: boolean
}

export const useSportsNavigation = (props: UseNavigationProps = {}) => {
  const { withGameCount = false } = props

  const startsAt_gt = getGameStartsAtGtValue()

  const options = useMemo<QueryHookOptions<NavigationQuery, NavigationQueryVariables>>(() => {
    const variables: NavigationQueryVariables = {
      first: 1000,
      withGameCount,
      where: {
        hasActiveConditions: true,
        status_in: [ GameStatus.Created, GameStatus.Paused ],
        startsAt_gt,
      },
    }

    return {
      variables,
      ssr: false,
    }
  }, [ withGameCount, startsAt_gt ])

  return useQuery<NavigationQuery, NavigationQueryVariables>(NavigationDocument, options)
}
