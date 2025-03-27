import {
  type NavigationQuery,
  type NavigationQueryVariables,

  NavigationDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { type SportHub, type QueryParameter } from '../../global'
import { useChain } from '../../contexts/chain'
import { gqlRequest } from '../../helpers/gqlRequest'


type UseNavigationProps = {
  filter?: {
    sportHub?: SportHub
    sportIds?: Array<string | number>
  }
  isLive?: boolean
  query?: QueryParameter<NavigationQuery['sports']>
}

export const useNavigation = (props: UseNavigationProps = {}) => {
  const { filter = {}, isLive, query = {} } = props

  const { graphql } = useChain()

  const gqlLink = graphql.feed

  return useQuery({
    queryKey: [
      'navigation',
      gqlLink,
      isLive,
      filter.sportHub,
      filter.sportIds?.join('-'),
    ],
    queryFn: async () => {
      const variables: NavigationQueryVariables = {
        first: 1000,
        sportFilter: {},
        countryFilter: {},
        leagueFilter: {},
      }

      if (isLive) {
        variables.countryFilter!.activeLiveGamesCount_not = 0
        variables.leagueFilter!.activeLiveGamesCount_not = 0
      }
      else {
        variables.countryFilter!.activePrematchGamesCount_not = 0
        variables.leagueFilter!.activePrematchGamesCount_not = 0
      }

      if (filter.sportHub) {
        variables.sportFilter!.sporthub = filter.sportHub
      }

      if (filter.sportIds?.length) {
        variables.sportFilter!.sportId_in = filter.sportIds
      }

      const { sports } = await gqlRequest<NavigationQuery, NavigationQueryVariables>({
        url: gqlLink,
        document: NavigationDocument,
        variables,
      })

      return sports
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
