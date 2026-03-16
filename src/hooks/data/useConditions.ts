import {
  type ChainId,

  getConditionsByGameIds,
  type GetConditionsByGameIdsParams,
  type ConditionDetailedData,
  ConditionState,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


export type UseConditionsProps = {
  gameId: GetConditionsByGameIdsParams['gameIds']
  onlyActiveOrStopped?: boolean
  chainId?: ChainId
  query?: QueryParameter<ConditionDetailedData[]>
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
export const useConditions = (props: UseConditionsProps): UseQueryResult<ConditionDetailedData[]> => {
  const { gameId, chainId, onlyActiveOrStopped, query = {} } = props
  const { chain } = useOptionalChain(chainId)

  return useQuery({
    queryKey: [
      'conditions',
      chain.id,
      gameId,
      onlyActiveOrStopped,
    ],
    queryFn: async () => {
      const conditions = await getConditionsByGameIds({
        chainId: chain.id,
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
