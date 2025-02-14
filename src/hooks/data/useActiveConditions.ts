import { type FetchPolicy } from '@apollo/client'
import {
  type Condition_Filter, ConditionStatus, MARGIN_DECIMALS, type OrderDirection, type PrematchConditionOrderBy,
} from '@azuro-org/toolkit'
import { useMemo } from 'react'
import { parseUnits } from 'viem'

import { useConditions } from './useConditions'


type UseConditionsProps = {
  gameId: string | bigint
  isLive: boolean
  livePollInterval?: number
  orderBy?: PrematchConditionOrderBy
  orderDirection?: OrderDirection
  filter?: {
    outcomeIds?: string[]
    maxMargin?: number
  }
  fetchPolicy?: FetchPolicy
}

export const useActiveConditions = (props: UseConditionsProps) => {
  const { gameId, isLive, livePollInterval, filter, fetchPolicy, orderBy, orderDirection } = props

  const conditionsFilter = useMemo<Condition_Filter>(() => {
    const _filter: Condition_Filter = {
      status_not: ConditionStatus.Resolved,
    }

    if (filter?.outcomeIds) {
      _filter.outcomesIds_contains = filter.outcomeIds
    }

    if (filter?.maxMargin) {
      _filter.margin_lte = parseUnits(String(filter.maxMargin), MARGIN_DECIMALS).toString()
      _filter.status = ConditionStatus.Created
    }

    return _filter
  }, [ filter?.outcomeIds, filter?.maxMargin ])

  const { prematchConditions, liveConditions, loading, error } = useConditions({
    gameId,
    filter: conditionsFilter,
    orderBy,
    orderDirection,
    prematchQuery: {
      skip: isLive,
      fetchPolicy,
    },
    liveQuery: {
      pollInterval: livePollInterval,
      skip: !isLive,
      fetchPolicy,
    },
  })

  const conditions = isLive ? liveConditions : prematchConditions

  return {
    conditions,
    loading,
    error,
  }
}
