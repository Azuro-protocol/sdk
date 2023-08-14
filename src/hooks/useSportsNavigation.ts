import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { NavigationDocument, NavigationQuery, NavigationQueryVariables } from '../docs/navigation'
import { getGameStartsAtGtValue } from '../helpers'


type UseNavigationProps = {
  withGameCount?: boolean
}

export const useSportsNavigation = (props: UseNavigationProps = {}) => {
  const { withGameCount = false } = props

  const startsAt_gt = getGameStartsAtGtValue()

  const options = useMemo<QueryHookOptions<NavigationQuery, NavigationQueryVariables>>(() => {
    const variables: NavigationQueryVariables = {
      withGameCount,
    }

    if (withGameCount) {
      variables.where = {
        startsAt_gt,
        hasActiveConditions: true,
      }
    }

    return {
      variables,
      ssr: false,
    }
  }, [ withGameCount, startsAt_gt ])

  return useQuery<NavigationQuery, NavigationQueryVariables>(NavigationDocument, options)
}
