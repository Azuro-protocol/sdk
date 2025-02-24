import { type Condition_Filter, ConditionStatus, MARGIN_DECIMALS } from '@azuro-org/toolkit'
import { useMemo } from 'react'
import { parseUnits } from 'viem'

import { useConditions } from './useConditions'


type UseConditionsProps = {
  gameId: string | bigint
  isLive: boolean
  liveRefetchInterval?: number
  filter?: {
    outcomeIds?: string[]
    maxMargin?: number
  }
}

export const useActiveConditions = (props: UseConditionsProps) => {
  const { gameId, isLive, liveRefetchInterval, filter } = props

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

  const { prematchQuery, liveQuery } = useConditions({
    gameId,
    filter: conditionsFilter,
    prematchQueryProps: {
      enabled: !isLive,
    },
    liveQueryProps: {
      refetchInterval: liveRefetchInterval,
      enabled: isLive,
    },
  })

  return isLive ? liveQuery : prematchQuery
}
