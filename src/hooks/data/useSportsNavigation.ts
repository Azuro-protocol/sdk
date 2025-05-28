import {
  type SportsNavigationQuery,
  type SportsNavigationQueryVariables,
  type ChainId,

  SportsNavigationDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { type SportHub, type QueryParameter } from '../../global'
import { useOptionalChain } from '../../contexts/chain'
import { gqlRequest } from '../../helpers/gqlRequest'


type UseSportsNavigationProps = {
  chainId?: ChainId
  filter?: {
    sportHub?: SportHub
    sportIds?: Array<string | number>
  }
  isLive?: boolean
  query?: QueryParameter<SportsNavigationQuery['sports']>
}

export const useSportsNavigation = (props: UseSportsNavigationProps = {}) => {
  const { chainId, filter = {}, isLive, query = {} } = props

  const chainData = useOptionalChain(chainId)

  const gqlLink = chainData.graphql.feed

  return useQuery({
    queryKey: [
      'sports-navigation',
      gqlLink,
      isLive,
      filter.sportHub,
      filter.sportIds?.join('-'),
    ],
    queryFn: async () => {
      const variables: SportsNavigationQueryVariables = {
        sportFilter: {},
      }

      if (isLive) {
        variables.sportFilter!.activeLiveGamesCount_not = 0
      }
      else {
        variables.sportFilter!.activePrematchGamesCount_not = 0
      }

      if (filter.sportHub) {
        variables.sportFilter!.sporthub = filter.sportHub
      }

      if (filter.sportIds?.length) {
        variables.sportFilter!.sportId_in = filter.sportIds
      }

      const { sports } = await gqlRequest<SportsNavigationQuery, SportsNavigationQueryVariables>({
        url: gqlLink,
        document: SportsNavigationDocument,
        variables,
      })

      return sports
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
