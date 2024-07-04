import { useMemo } from 'react'
import { type Market, groupConditionsByMarket } from '@azuro-org/toolkit'

import { useConditions } from './useConditions'
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

  const groupedMarkets = useMemo(() => {
    if (!prematchMarkets?.length || !liveMarkets?.length) {
      if (prematchMarkets?.length) {
        return prematchMarkets
      }

      if (liveMarkets?.length) {
        return liveMarkets
      }
    }

    return Object.values([ ...liveMarkets, ...prematchMarkets ].reduce((acc, market) => {
      const { marketKey } = market

      if (!acc[marketKey]) {
        acc[marketKey] = market
      }

      return acc
    }, {} as Record<string, Market>))
  }, [ prematchMarkets, liveMarkets ])

  return {
    groupedMarkets,
    prematchMarkets,
    liveMarkets,
    loading,
    error,
  }
}
