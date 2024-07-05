import { ConditionStatus } from '@azuro-org/toolkit'

import { useConditions } from './useConditions'


type UseConditionsProps = {
  gameId: string | bigint
  isLive: boolean
  livePollInterval?: number
  filter?: {
    outcomeIds?: string[]
  }
}

export const useActiveConditions = (props: UseConditionsProps) => {
  const { gameId, isLive, livePollInterval, filter } = props

  const { prematchConditions, liveConditions, loading, error } = useConditions({
    gameId,
    filter: {
      status_not: ConditionStatus.Resolved,
      outcomesIds_contains: filter?.outcomeIds || [],
    },
    prematchQuery: {
      skip: isLive,
    },
    liveQuery: {
      pollInterval: livePollInterval,
      skip: !isLive,
    },
  })

  const conditions = isLive ? liveConditions : prematchConditions

  return {
    conditions,
    loading,
    error,
  }
}
