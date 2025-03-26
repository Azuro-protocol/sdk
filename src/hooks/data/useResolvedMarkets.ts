import { useMemo } from 'react'
import { groupConditionsByMarket, ConditionState } from '@azuro-org/toolkit'

import { useConditions } from './useConditions'


type Props = {
  gameId: string
}

export const useResolvedMarkets = (props: Props) => {
  const { gameId } = props

  const { data: conditions, ...rest } = useConditions({
    gameId,
    filter: {
      state: ConditionState.Resolved,
    },
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
