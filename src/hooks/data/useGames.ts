import {
  type ChainId,
  GameState,
  OrderDirection,
  GameOrderBy,
  getGamesByFilters,
  type GetGamesByFiltersResult,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type SportHub, type QueryParameterWithSelect } from '../../global'

export type UseGamesQueryFnData = GetGamesByFiltersResult

export type UseGamesProps<TData = UseGamesQueryFnData> = {
  filter?: {
    sportHub?: SportHub
    sportSlug?: string
    sportIds?: Array<string | number>
    leagueSlug?: string
  }
  /** page number (1-based), default: 1 */
  page?: number
  /** items per page, default: 100 */
  perPage?: number
  orderBy?: GameOrderBy
  orderDir?: OrderDirection
  isLive?: boolean
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseGamesQueryFnData, TData>
}

export type GetUseGamesQueryOptionsProps<TData = UseGamesQueryFnData> = UseGamesProps<TData> & {
  chainId: ChainId
}

export const getUseGamesQueryOptions = <TData = UseGamesQueryFnData>(params: GetUseGamesQueryOptionsProps<TData>) => {
  const {
    filter = {},
    orderBy = GameOrderBy.StartsAt,
    orderDir = OrderDirection.Desc,
    isLive,
    chainId,
    perPage,
    page,
    query,
  } = params

  return queryOptions({
    queryKey: [
      'games',
      chainId,
      isLive,
      perPage,
      page,
      filter.sportHub,
      filter.sportSlug,
      filter.sportIds,
      filter.leagueSlug,
      orderBy,
      orderDir,
    ],
    queryFn: async () => {
      return getGamesByFilters({
        chainId,
        state: isLive ? GameState.Live : GameState.Prematch,
        leagueSlug: filter.leagueSlug,
        sportIds: filter.sportIds,
        sportHub: filter.sportHub,
        sportSlug: filter.sportSlug,
        orderBy,
        orderDir,
        perPage,
        page,
      })
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

/**
 * Fetches a list of games with optional filtering and sorting.
 * Supports filtering by sport, league, game state (live/prematch), and more.
 *
 * Use `isLive` prop to switch between live and prematch games.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useGames
 *
 * @example
 * import { useGames } from '@azuro-org/sdk'
 *
 * const { data, isLoading } = useGames({
 *   filter: { sportSlug: 'football' },
 *   perPage: 50,
 *   isLive: false
 * })
 *
 * const { games, page, total, totalPages } = data || {}
 * */
export const useGames = <TData = UseGamesQueryFnData>(props: UseGamesProps<TData> = {}): UseQueryResult<TData> => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(getUseGamesQueryOptions({ ...props, chainId: chain.id }))
}
