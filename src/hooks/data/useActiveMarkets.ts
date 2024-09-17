import { useMemo } from 'react'
import { GameStatus, groupConditionsByMarket } from '@azuro-org/toolkit'
import { type FetchPolicy } from '@apollo/client'

import { useActiveConditions } from './useActiveConditions'


type Props = {
  gameId: string
  gameStatus: GameStatus
  filter?: {
    outcomeIds?: string[]
    maxMargin?: number
  }
  livePollInterval?: number
  fetchPolicy?: FetchPolicy
}

export const useActiveMarkets = (props: Props) => {
  const { gameId, gameStatus, filter, livePollInterval, fetchPolicy } = props

  const { loading, conditions, error } = useActiveConditions({
    gameId,
    filter,
    isLive: gameStatus === GameStatus.Live,
    livePollInterval,
    fetchPolicy,
  })

  // generate unique key for memo deps
  const conditionIds = conditions?.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('_')

  const markets = useMemo(() => {
    if (!conditions?.length) {
      return []
    }

    return groupConditionsByMarket(conditions)
  }, [ conditionIds ])

  return {
    loading,
    markets,
    error,
  }
}
