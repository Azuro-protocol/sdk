import { ConditionState, type GameMarkets } from '@azuro-org/toolkit'
import { useEffect, useMemo, useState } from 'react'

import { useConditionsState } from './useConditionsState'
import { findActiveCondition } from '../../helpers/findActiveCondition'


export type UseActiveMarketProps = {
  markets: GameMarkets
}

/**
 * Manages active market selection and automatically switches to the next available market when conditions become
 * inactive. Tracks condition states across all markets and provides organized market data.
 *
 * Returns active market key, condition index, and organized market structures for navigation.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch/useActiveMarket
 *
 * @example
 * import { useActiveMarket } from '@azuro-org/sdk'
 *
 * const { data, isFetching } = useActiveMarket({ markets })
 * const { activeMarketKey, activeConditionIndex, otherMarkets, states } = data
 * */
export const useActiveMarket = ({ markets }: UseActiveMarketProps) => {
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
    return markets.reduce<{ conditionId: string, state: ConditionState, hidden?: boolean }[]>((acc, market) => {
      const { conditions } = market

      acc.push(...conditions)

      return acc
    }, [])
  }, [ markets ])

  const { data: states, isFetching } = useConditionsState({
    conditions,
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

    if (typeof nextConditionIndex !== 'undefined') {
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
