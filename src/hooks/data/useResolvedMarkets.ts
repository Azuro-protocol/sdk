import { useMemo } from 'react'
import { groupConditionsByMarket, ConditionState, type ConditionsQuery } from '@azuro-org/toolkit'

import { useConditions } from './useConditions'
import { type QueryParameter } from '../../global'


type UseResolvedMarketsProps = {
  gameId: string
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export const useResolvedMarkets = (props: UseResolvedMarketsProps) => {
  const { gameId, query = {} } = props

  const { data: conditions, ...rest } = useConditions({
    gameId,
    filter: {
      state: ConditionState.Resolved,
    },
    query,
  })

  const conditionIds = conditions?.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('_')

  const markets = useMemo(() => {
    if (!conditions?.length) {
      return []
    }

    return groupConditionsByMarket(conditions)
  }, [ conditionIds ])

  return {
    data: markets,
    ...rest,
  }
}
