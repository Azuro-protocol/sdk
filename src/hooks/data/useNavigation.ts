import {
  PrematchGraphGameStatus,

  type NavigationQuery,
  type NavigationQueryVariables,
  NavigationDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { type SportHub } from '../../global'
import { useChain } from '../../contexts/chain'
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

  const { graphql } = useChain()

  const startsAt = getGameStartsAtValue()
  const gqlLink = isLive ? graphql.live : graphql.prematch

  return useQuery({
    queryKey: [
      'navigation',
      gqlLink,
      withGameCount,
      startsAt,
      isLive,
      filter?.sportHub,
      filter?.sportIds?.join('-'),
    ],
    queryFn: async () => {
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

      const { sports } = await request<NavigationQuery, NavigationQueryVariables>({
        url: gqlLink,
        document: NavigationDocument,
        variables,
      })

      return sports
    },
  })
}
