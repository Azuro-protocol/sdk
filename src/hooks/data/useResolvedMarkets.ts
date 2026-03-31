import {
  groupConditionsByMarket,
  ConditionState,
  type ChainId,
  type ConditionDetailedData,
} from '@azuro-org/toolkit'

import { useConditions } from './useConditions'
import { type QueryParameter } from '../../global'


export type UseResolvedMarketsProps = {
  gameId: string
  chainId?: ChainId
  query?: QueryParameter<ConditionDetailedData[]>
}

export type UseResolvedMarkets = typeof useResolvedMarkets

const select = (conditions: ConditionDetailedData[]) => {
  if (!conditions?.length) {
    return undefined
  }

  return groupConditionsByMarket(
    conditions.filter((condition) => (
      condition.state === ConditionState.Resolved ||
      condition.state === ConditionState.Canceled
    ))
  )
}

/**
 * Get resolved markets grouped by market type for a specific game.
 * Wraps `useConditions` and groups conditions by market.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useResolvedMarkets
 *
 * @example
 * import { useResolvedMarkets } from '@azuro-org/sdk'
 *
 * const { data: markets, isFetching } = useResolvedMarkets({ gameId: '123' })
 * */
export const useResolvedMarkets = (props: UseResolvedMarketsProps) => {
  const { gameId, chainId, query = {} } = props

  return useConditions({
    gameId,
    chainId,
    query: {
      ...query,
      select,
    },
  })
}
