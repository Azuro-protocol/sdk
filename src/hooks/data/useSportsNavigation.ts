import {
  type ChainId,
  getNavigation,
  type GetNavigationResult,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { type SportHub, type QueryParameter } from '../../global'
import { useOptionalChain } from '../../contexts/chain'


export type UseSportsNavigationProps = {
  chainId?: ChainId
  filter?: {
    sportHub?: SportHub
    sportIds?: Array<string | number>
  }
  isLive?: boolean
  query?: QueryParameter<GetNavigationResult>
}

export type UseSportsNavigation = (props?: UseSportsNavigationProps) => UseQueryResult<GetNavigationResult>

/**
 * Get sports navigation data with countries and leagues hierarchy.
 * Returns a flat list of sports with nested countries and leagues.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useSportsNavigation
 *
 * @example
 * import { useSportsNavigation } from '@azuro-org/sdk'
 *
 * const { data: sports, isFetching } = useSportsNavigation({ isLive: false })
 * */
export const useSportsNavigation: UseSportsNavigation = (props = {}) => {
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
      return getNavigation({
        chainId: chainData.chain.id,
        sportIds: filter.sportIds,
        sportHub: filter.sportHub,
      })
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
