import { useMemo } from 'react'
import { type ConditionsQuery, groupConditionsByMarket } from '@azuro-org/toolkit'

import { useActiveConditions } from './useActiveConditions'
import { type QueryParameter } from '../../global'


type Props = {
  gameId: string
  filter?: {
    outcomeIds?: string[]
    maxMargin?: number
  }
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export const useActiveMarkets = (props: Props) => {
  const { gameId, filter, query: queryProps } = props

  const query = useActiveConditions({
    gameId,
    filter,
    query: queryProps,
  })

  const { data: conditions, ...rest } = query

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
