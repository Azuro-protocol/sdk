import { type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, type ConditionDetailedData, type GameMarkets, groupConditionsByMarket } from '@azuro-org/toolkit'

import { useActiveConditions } from './useActiveConditions'
import { type QueryParameter } from '../../global'


export type UseActiveMarketsProps = {
  gameId: string
  chainId?: ChainId
  extended?: boolean
  /**
   * Keep conditions and outcomes flagged `hidden` in the result. They are dropped by default, which
   * is what a running game should show - pass `true` for a finished game.
   * */
  includeHidden?: boolean
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
 * Get the markets a game currently offers, grouped by market type.
 * Wraps `useActiveConditions` and groups conditions by market using `groupConditionsByMarket`.
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
  const { gameId, chainId, extended, includeHidden, query = {} } = props

  return useActiveConditions({
    gameId,
    chainId,
    extended,
    includeHidden,
    query: {
      ...query,
      select,
    },
  })
}
