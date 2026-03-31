import { type UseQueryResult } from '@tanstack/react-query'

import { useConditions, type UseConditionsProps, type UseConditionsQueryFnData } from './useConditions'


export type UseActiveConditionsProps<TData = UseConditionsQueryFnData> = Pick<UseConditionsProps<TData>, 'gameId' | 'query' | 'chainId'>

export type UseActiveConditions = typeof useActiveConditions

/**
 * Fetch all active conditions for a game. Wraps `useConditions` hook.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useActiveConditions
 *
 * @example
 * import { useActiveConditions } from '@azuro-org/sdk'
 *
 * // gameData from useGames() or useGame()
 * const gameId = gameData.gameId
 * const { data, isFetching } = useActiveConditions({ gameId })
 * */
export const useActiveConditions =<TData = UseConditionsQueryFnData>(props: UseActiveConditionsProps<TData>): UseQueryResult<TData> => {
  const { gameId, chainId, query = {} } = props

  return useConditions({
    gameId,
    chainId,
    onlyActiveOrStopped: true,
    query,
  })
}
