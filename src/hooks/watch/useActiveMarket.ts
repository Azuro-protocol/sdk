import { ConditionState, type GameMarkets } from '@azuro-org/toolkit'
import { useEffect, useMemo, useState } from 'react'

import { useConditionsState } from './useConditionsState'
import { findActiveCondition } from '../../helpers/findActiveCondition'


type Props = {
  markets: GameMarkets
}

export const useActiveMarket = ({ markets }: Props) => {
  const { sortedMarketKeys, marketsByKey } = useMemo(() => {
    const defaultValue = {
      sortedMarketKeys: [] as string[],
      marketsByKey: {} as Record<string, GameMarkets[0]>,
    }

    if (!markets?.length) {
      return defaultValue
    }

    return markets.reduce<{sortedMarketKeys: string[], marketsByKey: Record<string, GameMarkets[0]>}>((acc, market) => {
      const { marketKey } = market

      acc.sortedMarketKeys.push(marketKey)
      acc.marketsByKey[marketKey] = market

      return acc
    }, defaultValue)
  }, [ markets ])

  const [ activeMarketKey, setActiveMarketKey ] = useState(sortedMarketKeys[0]!)
  const [ activeConditionIndex, setActiveConditionIndex ] = useState(0)

  const otherMarkets = useMemo(() => {
    return sortedMarketKeys.filter(key => key !== activeMarketKey)
  }, [ activeMarketKey, sortedMarketKeys ])

  const conditions = useMemo(() => {
    return markets.reduce<Record<string, ConditionState>>((acc, market) => {
      const { conditions } = market

      conditions.forEach(({ conditionId, state }) => {
        acc[conditionId] = state
      })

      return acc
    }, {})
  }, [ markets ])

  const { data: states, isFetching } = useConditionsState({
    conditionIds: Object.keys(conditions),
    initialStates: conditions,
  })

  useEffect(() => {
    if (!markets?.length) {
      return
    }

    const activeConditionId = marketsByKey[activeMarketKey!]!.conditions[activeConditionIndex]!.conditionId

    const activeStatus = (
      states[activeConditionId] || ConditionState.Active
    )

    if (activeStatus === ConditionState.Active) {
      return
    }

    const { nextMarketKey, nextConditionIndex } = findActiveCondition({
      states,
      marketsByKey,
      sortedMarketKeys,
      activeMarketKey,
    })

    if (nextMarketKey) {
      setActiveMarketKey(nextMarketKey)
    }

    if (nextConditionIndex) {
      setActiveConditionIndex(nextConditionIndex)
    }
  }, [ states ])

  return {
    data: {
      states,
      marketsByKey,
      activeMarketKey,
      activeConditionIndex,
      otherMarkets,
      sortedMarketKeys,
    },
    isFetching,
  }
}
