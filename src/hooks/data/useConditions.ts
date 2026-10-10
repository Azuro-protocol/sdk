import {
  type ChainId,
  type GetConditionsByGameIdsParams,
  type ConditionDetailedData,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'
import { batchFetchGameConditions } from '../../helpers/batchFetchGameConditions'


export type UseConditionsQueryFnData = ConditionDetailedData[]

export type UseConditionsProps<TData = UseConditionsQueryFnData> = {
  gameId: GetConditionsByGameIdsParams['gameIds']
  /** To also receive extended conditions (see `isExtendedConditionId` in `@azuro-org/toolkit`) that are not in the "dictionaries" package (managed via API only) */
  extended?: boolean
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseConditionsQueryFnData, TData>
}

export type GetUseConditionsQueryOptionsProps<TData = UseConditionsQueryFnData> = UseConditionsProps<TData> & {
  chainId: ChainId
}

export const getUseConditionsQueryOptions = <TData = UseConditionsQueryFnData>(params: GetUseConditionsQueryOptionsProps<TData>) => {
  const { gameId, chainId, extended, query } = params

  return queryOptions({
    queryKey: [
      'conditions',
      chainId,
      gameId,
      extended,
    ],
    queryFn: async (): Promise<UseConditionsQueryFnData> => {
      const gameIds = Array.isArray(gameId) ? gameId : [ gameId ]
      const conditionsByGameIdMap = await batchFetchGameConditions(gameIds, chainId, extended)

      return gameIds.flatMap((id) => conditionsByGameIdMap?.[id] || [])
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

export type UseConditions = typeof useConditions

/**
 * Use it to fetch [Conditions](https://gem.azuro.org/knowledge-hub/how-azuro-works/components/conditions) of a
 * specific game.
 *
 * Everything the game has is returned, including conditions and outcomes the feed flags `hidden`.
 * Deciding what to hide needs the live updates that only arrive for conditions that were
 * subscribed, so it belongs downstream of the subscription - use `useActiveConditions` or
 * `useActiveMarkets` for a list a bettor should see.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useConditions
 *
 * @example
 * import { useConditions } from '@azuro-org/sdk'
 *
 * // gameData from useGames() or useGame()
 * const gameId = gameData.gameId
 * const { data, isLoading, error } = useConditions({ gameId })
 * */
export const useConditions = <TData = UseConditionsQueryFnData>(props: UseConditionsProps<TData>): UseQueryResult<TData> => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(getUseConditionsQueryOptions({ ...props, chainId: chain.id }))
}
