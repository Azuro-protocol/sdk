import { ConditionStatus, liveHostAddress, type GameMarkets, type Selection } from '@azuro-org/toolkit'
import { useEffect, useMemo, useState } from 'react'

import { useSocket } from '../contexts/socket'
import { useChain } from '../contexts/chain'
import { useStatuses } from './watch/useStatuses'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import useIsMounted from '../helpers/hooks/useIsMounted'
import { findActiveCondition } from '../helpers/findActiveCondition'
import { batchFetchLiveConditions } from '../helpers/batchFetchLiveConditions'


type Props = {
  markets: GameMarkets
}

export const useActiveMarket = ({ markets }: Props) => {
  const { api } = useChain()
  const isMounted = useIsMounted()
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useSocket()

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

  const isLive = (
    markets?.[0]?.outcomeRows?.[0]?.[0]?.coreAddress?.toLocaleLowerCase() === liveHostAddress.toLocaleLowerCase()
  )

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

  // prematch part start

  const { statuses: prematchStatuses, loading: isPrematchStatusesFetching } = useStatuses({
    selections: isLive ? [] : selections,
  })

  useEffect(() => {
    if (isLive || !markets?.length) {
      return
    }

    const activeConditionId = marketsByKey[activeMarketKey!]!.outcomeRows[activeConditionIndex]![0]!.conditionId

    const activeStatus = (
      prematchStatuses[activeConditionId] || ConditionStatus.Created
    )

    if (activeStatus === ConditionStatus.Created) {
      return
    }

    const { nextMarketKey, nextConditionIndex } = findActiveCondition({
      statuses: prematchStatuses,
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
  }, [ prematchStatuses ])

  // prematch part end

  // live part start
  const [ liveConditionStatus, setLiveConditionStatus ] = useState(ConditionStatus.Created)

  useEffect(() => {
    if (!isLive || !markets.length) {
      return
    }

    const activeConditionId = marketsByKey[activeMarketKey!]!.outcomeRows[activeConditionIndex]![0]!.conditionId

    const unsubscribe = conditionStatusWatcher.subscribe(activeConditionId, (newStatus) => {
      setLiveConditionStatus(newStatus)
    })

    return () => {
      unsubscribe()
    }
  }, [ activeMarketKey, activeConditionIndex ])

  useEffect(() => {
    if (!isLive || !markets?.length || !isSocketReady) {
      return
    }

    const activeConditionId = marketsByKey[activeMarketKey!]!.outcomeRows[activeConditionIndex]![0]!.conditionId

    subscribeToUpdates([ activeConditionId ])

    return () => {
      unsubscribeToUpdates([ activeConditionId ])
    }
  }, [ activeMarketKey, activeConditionIndex, isSocketReady ])

  useEffect(() => {
    if (!isLive || !markets?.length || liveConditionStatus === ConditionStatus.Created) {
      return
    }

    let timeout: NodeJS.Timeout

    const getNextMarket = async () => {
      try {
        const conditionIds = [ ...new Set(
          selections.map(({ conditionId }) => conditionId)
        ) ]

        const data = await batchFetchLiveConditions(conditionIds, api)

        if (!isMounted()) {
          return
        }

        const statusByConditionId = conditionIds.reduce<Record<string, ConditionStatus>>((acc, conditionId) => {
          const { state } = data[conditionId] || { state: ConditionStatus.Paused }

          acc[conditionId] = state!

          return acc
        }, {})

        const { nextMarketKey, nextConditionIndex } = findActiveCondition({
          statuses: statusByConditionId,
          marketsByKey,
          sortedMarketKeys,
          activeMarketKey,
        })

        if (nextMarketKey) {
          setActiveMarketKey(nextMarketKey)

          if (nextConditionIndex) {
            setActiveConditionIndex(nextConditionIndex)
          }
        }
        // refetch in timeout
        else {

          const isContainsPausedState = Object.values(statusByConditionId).some(status => status === ConditionStatus.Paused)

          // if we have condition in paused state
          // then refetch statuses in 10s
          if (isContainsPausedState) {
            timeout = setTimeout(() => {
              if (isMounted()) {
                getNextMarket()
              }
            }, 10_000)
          }
        }
      }
      catch {}
    }

    getNextMarket()

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [ activeMarketKey, activeConditionIndex, liveConditionStatus ])

  // live part end

  return {
    marketsByKey,
    activeMarketKey,
    activeConditionIndex,
    otherMarkets,
    sortedMarketKeys,
    loading: isPrematchStatusesFetching,
  }
}
