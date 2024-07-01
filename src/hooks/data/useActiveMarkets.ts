import { useMemo } from 'react'

import { useActiveConditions } from './useActiveConditions'
import { GameStatus } from '../../utils/getGameStatus'
import { groupConditionsByMarket } from '../../utils/groupConditionsByMarket'


type Props = {
  gameId: string
  gameStatus: GameStatus
  filter?: {
    outcomeIds?: string[]
  }
  livePollInterval?: number
}

export const useActiveMarkets = (props: Props) => {
  const { gameId, gameStatus, filter, livePollInterval } = props

  const { loading, conditions, error } = useActiveConditions({
    gameId,
    filter,
    isLive: gameStatus === GameStatus.Live,
    livePollInterval,
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
