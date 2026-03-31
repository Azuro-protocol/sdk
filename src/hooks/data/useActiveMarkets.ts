import { type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, type ConditionDetailedData, type GameMarkets, groupConditionsByMarket } from '@azuro-org/toolkit'

import { useActiveConditions } from './useActiveConditions'
import { type QueryParameter } from '../../global'


export type UseActiveMarketsProps = {
  gameId: string
  chainId?: ChainId
  query?: QueryParameter<ConditionDetailedData[]>
}

export type UseActiveMarkets = (props: UseActiveMarketsProps) => UseQueryResult<GameMarkets | undefined>

const select = (conditions: ConditionDetailedData[]) => {
  if (!conditions?.length) {
    return undefined
  }

  return groupConditionsByMarket(conditions)
}


/**
 * Get active markets grouped by market type for a specific game.
 * Wraps `useActiveConditions` and groups conditions by market using `groupConditionsByMarket`.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useActiveMarkets
 *
 * @example
 * import { useActiveMarkets } from '@azuro-org/sdk'
 *
 * const { data: markets, isFetching } = useActiveMarkets({ gameId: '123' })
 * */
export const useActiveMarkets: UseActiveMarkets = (props) => {
  const { gameId, chainId, query = {} } = props

  return useActiveConditions({
    gameId,
    chainId,
    query: {
      ...query,
      select,
    },
  })
}
