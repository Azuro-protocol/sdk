import { useMemo } from 'react'

import { useResolvedConditions } from './useResolvedConditions'
import { groupConditionsByMarket } from '../../utils/groupConditionsByMarket'


type Props = {
  gameId: string
}

export const useActiveMarkets = (props: Props) => {
  const { gameId } = props

  const { loading, liveConditions, prematchConditions, error } = useResolvedConditions({
    gameId,
  })

  // generate unique key for memo deps
  const prematchConditionIds = prematchConditions?.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('_')
  const liveConditionIds = liveConditions?.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('_')

  const prematchMarkets = useMemo(() => {
    if (!prematchConditions?.length) {
      return []
    }

    return groupConditionsByMarket(prematchConditions)
  }, [ prematchConditionIds ])

  const liveMarkets = useMemo(() => {
    if (!liveConditions?.length) {
      return []
    }

    return groupConditionsByMarket(liveConditions)
  }, [ liveConditionIds ])

  return {
    prematchMarkets,
    liveMarkets,
    loading,
    error,
  }
}
