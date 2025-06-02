import { useMemo } from 'react'
import { groupConditionsByMarket, ConditionState, type ConditionsQuery, type ChainId, type GameMarkets } from '@azuro-org/toolkit'

import { useConditions } from './useConditions'
import { type WrapperUseQueryResult, type QueryParameter } from '../../global'


export type UseResolvedMarketsProps = {
  gameId: string
  chainId?: ChainId
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export type UseResolvedMarkets = (props: UseResolvedMarketsProps) => WrapperUseQueryResult<GameMarkets | undefined, ConditionsQuery['conditions']>

export const useResolvedMarkets: UseResolvedMarkets = (props) => {
  const { gameId, chainId, query = {} } = props

  const { data: conditions, ...rest } = useConditions({
    gameId,
    filter: {
      state: ConditionState.Resolved,
    },
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
