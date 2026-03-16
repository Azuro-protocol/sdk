import {
  type ChainId,
  type ConditionDetailedData,
} from '@azuro-org/toolkit'
import { type UseQueryResult } from '@tanstack/react-query'

import { useConditions, type UseConditionsProps } from './useConditions'


export type UseActiveConditionsProps = {
  gameId: UseConditionsProps['gameId']
  chainId?: ChainId
  query?: UseConditionsProps['query']
}

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
export const useActiveConditions = (props: UseActiveConditionsProps): UseQueryResult<ConditionDetailedData[]> => {
  const { gameId, chainId, query = {} } = props

  return useConditions({
    gameId,
    chainId,
    onlyActiveOrStopped: true,
    query,
  })
}
