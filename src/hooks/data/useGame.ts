import {
  type ChainId,
  getGamesByIds,
  type GameData,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'


export type UseGameQueryFnData = GameData | null

export type UseGameProps<TData = UseGameQueryFnData> = {
  gameId: string
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseGameQueryFnData, TData>
}

export type UseGame = <TData = UseGameQueryFnData>(props: UseGameProps<TData>) => UseQueryResult<TData>

export type GetUseGameQueryOptionsProps<TData = UseGameQueryFnData> = UseGameProps<TData> & {
  chainId: ChainId
}

export const getUseGameQueryOptions = <TData = UseGameQueryFnData>(props: GetUseGameQueryOptionsProps<TData>) => {
  const { gameId, chainId, query } = props

  return queryOptions({
    queryKey: [
      'game',
      chainId,
      gameId,
    ],
    queryFn: async () => {
      const games = await getGamesByIds({
        chainId,
        gameIds: [ gameId ],
      })

      return games?.[0] || null
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

/**
 * Use it to fetch a specific game by gameId parameter.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useGame
 *
 * @example
 * import { useGame } from '@azuro-org/sdk'
 *
 * // e.g., game page your-app-url/polygon/football/.../{gameId}
 * const { gameId } = useParams<{ gameId: string }>()
 * const { data, isLoading, error } = useGame({ gameId })
 * */
export const useGame = <TData = UseGameQueryFnData>(props: UseGameProps<TData>): UseQueryResult<TData> => {
  const { gameId, chainId, query = {} } = props

  const { chain } = useOptionalChain(chainId)

  return useQuery(getUseGameQueryOptions({ gameId, chainId: chain.id, query }))
}
