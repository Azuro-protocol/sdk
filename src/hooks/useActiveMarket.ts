import { ConditionState, type GameMarkets, type Selection } from '@azuro-org/toolkit'
import { useEffect, useMemo, useState } from 'react'

import { useSelectionsState } from './watch/useSelectionsState'
import { findActiveCondition } from '../helpers/findActiveCondition'


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

  const selections = useMemo(() => {
    return markets.reduce<Selection[]>((acc, market) => {
      const { outcomeRows } = market

      outcomeRows.forEach(outcomes => {
        outcomes.forEach((outcome) => {
          acc.push(outcome)
        })
      })

      return acc
    }, [])
  }, [ markets ])

  const { states, isFetching } = useSelectionsState({
    selections,
  })

  useEffect(() => {
    if (!markets?.length) {
      return
    }

    const activeConditionId = marketsByKey[activeMarketKey!]!.outcomeRows[activeConditionIndex]![0]!.conditionId

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
    marketsByKey,
    activeMarketKey,
    activeConditionIndex,
    otherMarkets,
    sortedMarketKeys,
    isFetching,
  }
}
