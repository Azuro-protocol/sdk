import { useMemo } from 'react'

import { useConditions } from './useConditions'
import { groupConditionsByMarket } from '../../utils/groupConditionsByMarket'
import { ConditionStatus } from '../../docs/prematch/types'


type Props = {
  gameId: string
}

export const useResolvedMarkets = (props: Props) => {
  const { gameId } = props

  const { loading, liveConditions, prematchConditions, error } = useConditions({
    gameId,
    filter: {
      status: ConditionStatus.Resolved,
    },
  })

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
