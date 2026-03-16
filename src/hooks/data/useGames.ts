import {
  type ChainId,
  GameState,
  OrderDirection,
  GameOrderBy,
  getGamesByFilters,
  type GetGamesByFiltersResult,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type SportHub, type QueryParameter } from '../../global'


export type UseGamesProps = {
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
  query?: QueryParameter<GetGamesByFiltersResult>
}

export type UseGames = (props?: UseGamesProps) => UseQueryResult<GetGamesByFiltersResult>

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
 *   filter: { sportSlug: 'football', limit: 50 },
 *   isLive: false
 * })
 *
 * const { games, page, total, totalPages } = data || {}
 * */
export const useGames: UseGames = (props = {}) => {
  const {
    filter = {},
    orderBy = GameOrderBy.StartsAt,
    orderDir = OrderDirection.Desc,
    isLive,
    chainId,
    perPage,
    page,
    query = {},
  } = props

  const { chain } = useOptionalChain(chainId)

  return useQuery({
    queryKey: [
      'games',
      chain.id,
      isLive,
      perPage,
      page,
      filter.sportHub,
      filter.sportSlug,
      filter.sportIds?.join('-'),
      filter.leagueSlug,
      orderBy,
      orderDir,
    ],
    queryFn: async () => {
      return getGamesByFilters({
        chainId: chain.id,
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
