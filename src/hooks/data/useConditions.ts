import {
  type ChainId,

  getConditionsByGameIds,
  type GetConditionsByGameIdsParams,
  type ConditionDetailedData,
  ConditionState,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'

export type UseConditionsQueryFnData = ConditionDetailedData[]

export type UseConditionsProps<TData = UseConditionsQueryFnData> = {
  gameId: GetConditionsByGameIdsParams['gameIds']
  onlyActiveOrStopped?: boolean
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseConditionsQueryFnData, TData>
}

export type GetUseConditionsQueryOptionsProps<TData = UseConditionsQueryFnData> = UseConditionsProps<TData> & {
  chainId: ChainId
}

export const getUseConditionsQueryOptions = <TData = UseConditionsQueryFnData>(params: GetUseConditionsQueryOptionsProps<TData>) => {
  const { gameId, chainId, onlyActiveOrStopped, query } = params

  return queryOptions({
    queryKey: [
      'conditions',
      chainId,
      gameId,
      onlyActiveOrStopped,
    ],
    queryFn: async (): Promise<UseConditionsQueryFnData> => {
      const conditions = await getConditionsByGameIds({
        chainId,
        gameIds: gameId,
      })

      if (onlyActiveOrStopped) {
        return conditions.filter(({ state }) => state === ConditionState.Active || ConditionState.Stopped)
      }

      return conditions
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
