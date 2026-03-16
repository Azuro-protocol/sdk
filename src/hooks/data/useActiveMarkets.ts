import { useMemo } from 'react'
import { type ChainId, type ConditionDetailedData, type GameMarkets, groupConditionsByMarket } from '@azuro-org/toolkit'

import { useActiveConditions } from './useActiveConditions'
import { type WrapperUseQueryResult, type QueryParameter } from '../../global'


export type UseActiveMarketsProps = {
  gameId: string
  // filter?: {
  //   outcomeIds?: string[]
  //   maxMargin?: number
  // }
  chainId?: ChainId
  query?: QueryParameter<ConditionDetailedData[]>
}

export type UseActiveMarkets = (props: UseActiveMarketsProps) => WrapperUseQueryResult<GameMarkets | undefined, ConditionDetailedData[]>

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

  const { data: conditions, ...rest } = useActiveConditions({
    gameId,
    chainId,
    query,
  })

  const conditionIds = conditions?.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('_')

  const markets = useMemo(() => {
    if (!conditions?.length) {
      return undefined
    }

    return groupConditionsByMarket(conditions)
  }, [ conditionIds ])

  return {
    data: markets,
    ...rest,
  }
}
