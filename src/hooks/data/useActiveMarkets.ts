import { useMemo } from 'react'
import { type ChainId, type GameMarkets, groupConditionsByMarket } from '@azuro-org/toolkit'

import { useActiveConditions } from './useActiveConditions'
import { type UseConditionsQueryFnData } from './useConditions'
import { type QueryParameter, type WrapperUseQueryResult } from '../../global'


export type UseActiveMarketsProps = {
  gameId: string
  chainId?: ChainId
  extended?: boolean
  /**
   * Keep conditions and outcomes flagged `hidden` in the result. They are dropped by default, which
   * is what a running game should show - pass `true` for a game that is over.
   * */
  includeHidden?: boolean
  query?: QueryParameter<UseConditionsQueryFnData>
}

export type UseActiveMarketsResult = WrapperUseQueryResult<GameMarkets | undefined, UseConditionsQueryFnData>

export type UseActiveMarkets = (props: UseActiveMarketsProps) => UseActiveMarketsResult

/**
 * Get the markets a game currently offers, grouped by market type.
 * Wraps `useActiveConditions` and groups conditions by market using `groupConditionsByMarket`.
 *
 * Requires `FeedSocketProvider` and `ConditionUpdatesProvider` (both are included in
 * `AzuroSDKProvider`) - see `useActiveConditions` for how visibility is decided.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useActiveMarkets
 *
 * @example
 * import { useActiveMarkets } from '@azuro-org/sdk'
 *
 * const { data: markets, isFetching } = useActiveMarkets({ gameId: '123' })
 *
 * // the game is over - show everything, including what was hidden while it ran
 * const { data: allMarkets } = useActiveMarkets({ gameId: '123', includeHidden: true })
 * */
export const useActiveMarkets: UseActiveMarkets = (props) => {
  const { gameId, chainId, extended, includeHidden, query } = props

  const { data: conditions, ...conditionsResult } = useActiveConditions({
    gameId,
    chainId,
    extended,
    includeHidden,
    query,
  })

  const data = useMemo(() => {
    if (!conditions?.length) {
      return undefined
    }

    return groupConditionsByMarket(conditions)
  }, [ conditions ])

  return {
    ...conditionsResult,
    data,
  }
}
