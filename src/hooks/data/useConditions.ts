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
  /**
   * Keep conditions and outcomes flagged `hidden` in the result.
   *
   * While a game is running, hidden conditions and outcomes are not offered, so they are dropped by
   * default. Once the game is finished they become part of the result the bettor should see, so
   * finished-game views should pass `true`.
   * */
  includeHidden?: boolean
  /** To receive new conditions ("5...") that are not in the "dictionaries" package (managed via API only) */
  extended?: boolean
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseConditionsQueryFnData, TData>
}

export type GetUseConditionsQueryOptionsProps<TData = UseConditionsQueryFnData> = UseConditionsProps<TData> & {
  chainId: ChainId
}

const dropHidden = (conditions: ConditionDetailedData[]): ConditionDetailedData[] => (
  conditions.reduce<ConditionDetailedData[]>((acc, condition) => {
    if (condition.hidden) {
      return acc
    }

    const outcomes = condition.outcomes.filter(({ hidden }) => !hidden)

    // a condition whose every outcome is hidden has nothing left to offer
    if (!outcomes.length) {
      return acc
    }

    acc.push(outcomes.length === condition.outcomes.length ? condition : { ...condition, outcomes })

    return acc
  }, [])
)

export const getUseConditionsQueryOptions = <TData = UseConditionsQueryFnData>(params: GetUseConditionsQueryOptionsProps<TData>) => {
  const { gameId, chainId, includeHidden, extended, query } = params

  return queryOptions({
    queryKey: [
      'conditions',
      chainId,
      gameId,
      includeHidden,
      extended,
    ],
    queryFn: async (): Promise<UseConditionsQueryFnData> => {
      const gameIds = Array.isArray(gameId) ? gameId : [ gameId ]
      const conditionsByGameIdMap = await batchFetchGameConditions(gameIds, chainId, extended)
      const conditions = gameIds.flatMap((id) => conditionsByGameIdMap?.[id] || [])

      if (includeHidden) {
        return conditions
      }

      return dropHidden(conditions)
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
 * Conditions and outcomes flagged `hidden` are dropped by default, which is what a running game
 * should show. Pass `includeHidden` to keep them, e.g. for a finished game.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useConditions
 *
 * @example
 * import { useConditions } from '@azuro-org/sdk'
 *
 * // gameData from useGames() or useGame()
 * const gameId = gameData.gameId
 * const { data, isLoading, error } = useConditions({ gameId })
 *
 * // the game is over - show everything, including what was hidden while it ran
 * const { data: allConditions } = useConditions({ gameId, includeHidden: true })
 * */
export const useConditions = <TData = UseConditionsQueryFnData>(props: UseConditionsProps<TData>): UseQueryResult<TData> => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(getUseConditionsQueryOptions({ ...props, chainId: chain.id }))
}
