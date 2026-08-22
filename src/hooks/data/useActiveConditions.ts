import { type UseQueryResult } from '@tanstack/react-query'

import { useConditions, type UseConditionsProps, type UseConditionsQueryFnData } from './useConditions'


export type UseActiveConditionsProps<TData = UseConditionsQueryFnData> =
  Pick<UseConditionsProps<TData>, 'gameId' | 'query' | 'chainId' | 'extended' | 'includeHidden'>

export type UseActiveConditions = typeof useActiveConditions

/**
 * Fetch the conditions a game currently offers. Wraps `useConditions` hook.
 *
 * Conditions and outcomes flagged `hidden` are dropped, which is what a running game should show.
 * Pass `includeHidden` to keep them, e.g. for a finished game.
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
export const useActiveConditions = <TData = UseConditionsQueryFnData>(props: UseActiveConditionsProps<TData>): UseQueryResult<TData> => {
  const { gameId, chainId, extended, includeHidden, query = {} } = props

  return useConditions({
    gameId,
    chainId,
    extended,
    includeHidden,
    query,
  })
}
