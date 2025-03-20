import { useMemo } from 'react'
import { groupConditionsByMarket, ConditionState } from '@azuro-org/toolkit'

import { useConditions } from './useConditions'


type Props = {
  gameId: string
}

export const useResolvedMarkets = (props: Props) => {
  const { gameId } = props

  const { data: conditions, ...rest } = useConditions({
    gameId,
    filter: {
      state: ConditionState.Resolved,
    },
  })

  const conditionIds = conditions?.map(({ id, outcomes }) => `${id}-${outcomes.length}`).join('_')

  const markets = useMemo(() => {
    if (!conditions?.length) {
      return []
    }

    return groupConditionsByMarket(conditions)
  }, [ conditionIds ])

  // const groupedMarkets = useMemo(() => {
  //   if (!prematchMarkets?.length || !liveMarkets?.length) {
  //     if (prematchMarkets?.length) {
  //       return prematchMarkets
  //     }

  //     if (liveMarkets?.length) {
  //       return liveMarkets
  //     }
  //   }

  //   return Object.values([ ...liveMarkets, ...prematchMarkets ].reduce((acc, market) => {
  //     const { marketKey } = market

  //     if (!acc[marketKey]) {
  //       acc[marketKey] = market
  //     }

  //     return acc
  //   }, {} as Record<string, Market>))
  // }, [ prematchMarkets, liveMarkets ])

  return {
    data: markets,
    ...rest,
  }
}
