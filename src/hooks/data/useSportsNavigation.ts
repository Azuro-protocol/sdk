import {
  type SportsNavigationQuery,
  type SportsNavigationQueryVariables,

  type ChainId,

  SportsNavigationDocument,
  chainsData,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { use } from 'react'

import { type SportHub, type QueryParameter } from '../../global'
import { ChainContext, useChain } from '../../contexts/chain'
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

  let gqlLink: string

  if (chainId) {
    gqlLink = chainsData[chainId].graphql.feed
  }
  else {
    const chainContext = use(ChainContext)

    if (!chainContext) {
      throw new Error('Please provide chainId or use ChainProvider')
    }

    gqlLink = chainContext.graphql.feed
  }

  // const { graphql } = useChain()

  // const gqlLink = graphql.feed

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
