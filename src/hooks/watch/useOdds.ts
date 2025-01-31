import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useConfig } from 'wagmi'
import { type Selection, liveHostAddress, calcLiveOdds, calcPrematchOdds } from '@azuro-org/toolkit'

import { useChain } from '../../contexts/chain'
import { useOddsSocket, type OddsChangedData } from '../../contexts/oddsSocket'
import { formatToFixed } from '../../helpers'
import useIsMounted from '../../helpers/hooks/useIsMounted'
import { oddsWatcher } from '../../modules/oddsWatcher'
import { debounce } from '../../helpers/debounce'


type CalcOddsProps = {
  selections: Selection[]
  betAmount?: string
  batchBetAmounts?: Record<string, string>
}

export const useOdds = ({ selections, betAmount, batchBetAmounts }: CalcOddsProps) => {
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useOddsSocket()
  const { appChain } = useChain()
  const config = useConfig()
  const isMounted = useIsMounted()

  const { liveItems, prematchItems } = useMemo<{ liveItems: Selection[], prematchItems: Selection[] }>(() => {
    return selections.reduce((acc, item) => {
      if (item.coreAddress.toLocaleLowerCase() === liveHostAddress.toLocaleLowerCase()) {
        acc.liveItems.push(item)
      }
      else {
        acc.prematchItems.push(item)
      }

      return acc
    }, {
      liveItems: [],
      prematchItems: [],
    } as { liveItems: Selection[], prematchItems: Selection[] })
  }, [ selections ])

  const selectionsKey = useMemo(() => (
    selections.map(({ conditionId }) => conditionId).join('-')
  ), [ selections ])
  const liveKey = useMemo(() => (
    liveItems.map(({ conditionId }) => conditionId).join('-')
  ), [ liveItems ])
  const prematchKey = useMemo(() => (
    prematchItems.map(({ conditionId }) => conditionId).join('-')
  ), [ prematchItems ])

  const [ odds, setOdds ] = useState<Record<string, number>>({})
  const [ totalOdds, setTotalOdds ] = useState<number>(0)
  const [ isPrematchOddsFetching, setPrematchOddsFetching ] = useState(Boolean(prematchItems.length))

  const oddsDataRef = useRef<Record<string, OddsChangedData>>({})
  const betAmountRef = useRef(betAmount)
  const batchBetAmountsRef = useRef(batchBetAmounts)
  const prevSelectionsKeyRef = useRef(selectionsKey)
  const prevPrematchKeyRef = useRef(prematchKey)

  if (
    prematchItems.length && (
      prematchKey !== prevPrematchKeyRef.current
      || betAmount !== betAmountRef.current
      || batchBetAmounts !== batchBetAmountsRef.current
    )
  ) {
    setPrematchOddsFetching(true)
  }

  if (
    selectionsKey !== prevSelectionsKeyRef.current
    || betAmount !== betAmountRef.current
    || batchBetAmounts !== batchBetAmountsRef.current
  ) {
    setOdds({})
    setTotalOdds(1)
  }

  prevSelectionsKeyRef.current = selectionsKey
  prevPrematchKeyRef.current = prematchKey
  betAmountRef.current = betAmount
  batchBetAmountsRef.current = batchBetAmounts

  const isLiveOddsFetching = useMemo(() => {
    return !liveItems.every(({ conditionId, outcomeId }) => Boolean(odds[`${conditionId}-${outcomeId}`]))
  }, [ liveKey, odds ])

  const maxBet = useMemo<number | undefined>(() => {
    if (!liveItems.length || liveItems.length > 1) {
      return undefined
    }

    const { conditionId, outcomeId } = liveItems[0]!

    return oddsDataRef.current?.[conditionId]?.outcomes?.[outcomeId]?.maxBet
  }, [ liveKey, odds ]) // we need odds in deps because we update oddsDataRef with odds

  const fetchPrematchOdds = async () => {
    if (!prematchItems.length) {
      return
    }

    try {
      const prematchOdds = await calcPrematchOdds({
        config,
        betAmount: betAmountRef.current,
        batchBetAmounts: batchBetAmountsRef.current,
        selections: prematchItems,
        chainId: appChain.id,
      })

      if (isMounted()) {
        setOdds(odds => {
          const newOdds = { ...odds, ...prematchOdds }
          const newTotalOdds = +formatToFixed(Object.keys(newOdds).reduce((acc, key) => acc * +newOdds[key]!, 1), 5)

          setTotalOdds(newTotalOdds)

          return newOdds
        })
        setPrematchOddsFetching(false)
      }
    }
    catch (err) {
      if (isMounted()) {
        setPrematchOddsFetching(false)
      }
    }
  }

  const fetchLiveOdds = (items: Selection[], newOddsData?: OddsChangedData) => {
    if (!items.length) {
      return
    }

    if (newOddsData) {
      oddsDataRef.current[newOddsData.conditionId] = newOddsData
    }

    const liveOdds = items.reduce((acc, item) => {
      const { conditionId, outcomeId } = item
      const oddsData = oddsDataRef.current[conditionId]

      if (!oddsData) {
        return acc
      }

      acc[`${conditionId}-${outcomeId}`] = calcLiveOdds({ selection: item, betAmount: betAmountRef.current, oddsData })

      return acc
    }, {} as Record<string, number>)

    setOdds(odds => {
      const newOdds = { ...odds, ...liveOdds }
      const newTotalOdds = +formatToFixed(Object.keys(newOdds).reduce((acc, key) => acc * +newOdds[key]!, 1), 3)

      setTotalOdds(newTotalOdds)

      return newOdds
    })
  }

  const fetchOdds = useCallback(debounce(() => {
    fetchPrematchOdds()
    fetchLiveOdds(liveItems)
  }, 100), [ selectionsKey ])

  useEffect(() => {
    if (!isSocketReady || !liveItems.length) {
      return
    }

    const ids = liveKey.split('-')

    subscribeToUpdates(ids)

    return () => {
      unsubscribeToUpdates(ids)
    }
  }, [ liveKey, isSocketReady ])

  useEffect(() => {
    fetchOdds()
  }, [ fetchOdds, betAmount, batchBetAmounts ])

  useEffect(() => {
    if (!selections?.length) {
      return
    }

    const unsubscribeList = selections.map(({ conditionId }) => {
      return oddsWatcher.subscribe(`${conditionId}`, (oddsData?: OddsChangedData) => {
        if (oddsData) {
          const item = liveItems.find(item => item.conditionId === oddsData.conditionId)
          fetchLiveOdds([ item! ], oddsData)
        }
        else {
          setPrematchOddsFetching(true)
          fetchPrematchOdds()
        }
      })
    })

    return () => {
      unsubscribeList.forEach((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [ selectionsKey ])

  return {
    odds,
    totalOdds,
    maxBet,
    loading: isPrematchOddsFetching || isLiveOddsFetching,
  }
}
