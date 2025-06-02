import { useMemo } from 'react'
import { type ChainId, type ConditionsQuery, type GameMarkets, groupConditionsByMarket } from '@azuro-org/toolkit'

import { useActiveConditions } from './useActiveConditions'
import { type WrapperUseQueryResult, type QueryParameter } from '../../global'


export type UseActiveMarketsProps = {
  gameId: string
  filter?: {
    outcomeIds?: string[]
    maxMargin?: number
  }
  chainId?: ChainId
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export type UseActiveMarkets = (props: UseActiveMarketsProps) => WrapperUseQueryResult<GameMarkets | undefined, ConditionsQuery['conditions']>

export const useActiveMarkets: UseActiveMarkets = (props) => {
  const { gameId, filter, chainId, query = {} } = props

  const { data: conditions, ...rest } = useActiveConditions({
    gameId,
    filter,
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
