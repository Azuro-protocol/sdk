import { type Condition_Filter, type ConditionsQuery, ConditionState } from '@azuro-org/toolkit'
import { useMemo } from 'react'

import { useConditions } from './useConditions'
import { type QueryParameter } from '../../global'


type UseActiveConditionsProps = {
  gameId: string | bigint
  filter?: {
    outcomeIds?: string[]
  }
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export const useActiveConditions = (props: UseActiveConditionsProps) => {
  const { gameId, filter = {}, query = {} } = props

  const conditionsFilter = useMemo<Condition_Filter>(() => {
    const _filter: Condition_Filter = {
      state_in: [ ConditionState.Active, ConditionState.Stopped ],
    }

    if (filter?.outcomeIds) {
      _filter.outcomesIds_contains = filter.outcomeIds
    }

    return _filter
  }, [ filter?.outcomeIds ])

  return useConditions({
    gameId,
    filter: conditionsFilter,
    query,
  })
}
