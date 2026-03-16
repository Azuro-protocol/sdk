import {
  type ChainId,
  type ConditionDetailedData,
} from '@azuro-org/toolkit'
import { type UseQueryResult } from '@tanstack/react-query'

import { useConditions, type UseConditionsProps } from './useConditions'


export type UseActiveConditionsProps = {
  gameId: UseConditionsProps['gameId']
  // filter?: {
  //   outcomeIds?: string[]
  // }
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

  // const conditionsFilter = useMemo(() => {
  //   const _filter: UseConditionsProps['filter'] = {
  //     states: [ ConditionState.Active, ConditionState.Stopped ],
  //   }
  //
  //   if (filter.outcomeIds) {
  //     _filter.outcomeIds = filter.outcomeIds
  //   }
  //
  //   if (filter.maxMargin) {
  //     _filter.maxMargin = filter.maxMargin
  //   }
  //
  //   return _filter
  // }, [ filter.outcomeIds, filter.maxMargin ])

  return useConditions({
    gameId,
    chainId,
    onlyActiveOrStopped: true,
    query,
  })
}
