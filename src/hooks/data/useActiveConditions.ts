import { type Condition_Filter, type ConditionsQuery, ConditionState } from '@azuro-org/toolkit'
import { useMemo } from 'react'

import { useConditions } from './useConditions'
import { type QueryParameter } from '../../global'


type UseActiveConditionsProps = {
  gameId: string | bigint
  filter?: {
    outcomeIds?: string[]
    maxMargin?: number | string
  }
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export const useActiveConditions = (props: UseActiveConditionsProps) => {
  const { gameId, filter = {}, query = {} } = props

  const conditionsFilter = useMemo<Condition_Filter>(() => {
    const _filter: Condition_Filter = {
      state_in: [ ConditionState.Active, ConditionState.Stopped ],
    }

    if (filter.outcomeIds) {
      _filter.outcomesIds_contains = filter.outcomeIds
    }

    if (filter.maxMargin) {
      _filter.margin_lte = String(filter.maxMargin)
    }

    return _filter
  }, [ filter.outcomeIds, filter.maxMargin ])

  return useConditions({
    gameId,
    filter: conditionsFilter,
    query,
  })
}
