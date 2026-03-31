import {
  type ChainId,
  getNavigation,
  type GetNavigationResult,
} from '@azuro-org/toolkit'
import { queryOptions, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { type SportHub, type QueryParameterWithSelect } from '../../global'
import { useOptionalChain } from '../../contexts/chain'


export type UseSportsNavigationQueryFnData = GetNavigationResult

export type UseSportsNavigationProps<TData = UseSportsNavigationQueryFnData> = {
  chainId?: ChainId
  filter?: {
    sportHub?: SportHub
    sportIds?: Array<string | number>
  }
  isLive?: boolean
  query?: QueryParameterWithSelect<UseSportsNavigationQueryFnData, TData>
}

export type GetUseSportsNavigationQueryOptionsProps<TData = UseSportsNavigationQueryFnData> = UseSportsNavigationProps<TData> & {
  chainId: ChainId
}

export type UseSportsNavigation = <TData = UseSportsNavigationQueryFnData>(props?: UseSportsNavigationProps<TData>) => UseQueryResult<TData>

export const getUseSportsNavigationQueryOptions = <TData = UseSportsNavigationQueryFnData>(params: GetUseSportsNavigationQueryOptionsProps<TData>) => {
  const { chainId, filter = {}, isLive, query } = params

  return queryOptions({
    queryKey: [
      'sports-navigation',
      chainId,
      isLive,
      filter.sportHub,
      filter.sportIds,
    ],
    queryFn: async () => {
      return getNavigation({
        chainId,
        sportIds: filter.sportIds,
        sportHub: filter.sportHub,
      })
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

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
export const useSportsNavigation = <TData>(props: UseSportsNavigationProps<TData> = {}) => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(getUseSportsNavigationQueryOptions({ ...props, chainId: chain.id }))
}
