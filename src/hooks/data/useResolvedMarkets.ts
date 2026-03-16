import { useMemo } from 'react'
import {
  groupConditionsByMarket,
  ConditionState,
  type ChainId,
  type GameMarkets,
  type ConditionDetailedData,
} from '@azuro-org/toolkit'

import { useConditions } from './useConditions'
import { type WrapperUseQueryResult, type QueryParameter } from '../../global'


export type UseResolvedMarketsProps = {
  gameId: string
  chainId?: ChainId
  query?: QueryParameter<ConditionDetailedData[]>
}

export type UseResolvedMarkets = (props: UseResolvedMarketsProps) => WrapperUseQueryResult<GameMarkets | undefined, ConditionDetailedData[]>

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
export const useResolvedMarkets: UseResolvedMarkets = (props) => {
  const { gameId, chainId, query = {} } = props

  const { data: conditions, ...rest } = useConditions({
    gameId,
    chainId,
    query,
  })

  const conditionIds = conditions?.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('_')

  const markets = useMemo(() => {
    if (!conditions?.length) {
      return undefined
    }

    return groupConditionsByMarket(
      conditions.filter((condition) => (
        condition.state === ConditionState.Resolved ||
        condition.state === ConditionState.Canceled
      ))
    )
  }, [ conditionIds ])

  return {
    data: markets,
    ...rest,
  }
}
