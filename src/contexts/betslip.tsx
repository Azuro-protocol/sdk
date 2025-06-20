import React, { useContext, createContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  type Selection,
  type Freebet,

  ConditionState,
} from '@azuro-org/toolkit'
import { type Address } from 'viem'

import { localStorageKeys } from '../config'
import { useChain } from './chain'
import { useOdds } from '../hooks/watch/useOdds'
import { useConditionsState } from '../hooks/watch/useConditionsState'
import { useAvailableFreebets } from '../hooks/bonus/useAvailableFreebets'
import useForceUpdate from '../hooks/helpers/useForceUpdate'
import { useMaxBet } from '../hooks/data/useMaxBet'
import { useExtendedAccount } from '../hooks/useAaConnector'


export enum BetslipDisableReason {
  ConditionState = 'ConditionState',
  BetAmountGreaterThanMaxBet = 'BetAmountGreaterThanMaxBet',
  BetAmountLowerThanMinBet = 'BetAmountLowerThanMinBet',
  ComboWithForbiddenItem = 'ComboWithForbiddenItem',
  ComboWithSameGame = 'ComboWithSameGame',
  SelectedOutcomesTemporarySuspended = 'SelectedOutcomesTemporarySuspended',

  /**
    * @deprecated Only for v2
  */
  PrematchConditionInStartedGame = 'PrematchConditionInStartedGame',
  FreeBetExpired = 'FreeBetExpired',
}

type RemoveItemProps = Selection

// type ChangeBatchBetAmountItem = Selection

export type BaseBetslipContextValue = {
  items: AzuroSDK.BetslipItem[]
  addItem: (itemProps: AzuroSDK.BetslipItem) => void
  removeItem: (itemProps: RemoveItemProps) => void
  clear: () => void
}

export type DetailedBetslipContextValue = {
  betAmount: string
  // batchBetAmounts: Record<string, string>
  odds: Record<string, number>
  totalOdds: number
  maxBet: number | undefined
  minBet: number | undefined
  selectedFreebet: Freebet | undefined
  freebets: Freebet[] | undefined | null
  states: Record<string, ConditionState>
  disableReason: BetslipDisableReason | undefined
  changeBetAmount: (value: string) => void
  // changeBatchBetAmount: (item: ChangeBatchBetAmountItem, value: string) => void
  // changeBatch: (value: boolean) => void
  selectFreebet: (value?: Freebet) => void
  // isBatch: boolean
  isStatesFetching: boolean
  isOddsFetching: boolean
  isFreebetsFetching: boolean
  isMaxBetFetching: boolean
  isBetAllowed: boolean
}

export const BaseBetslipContext = createContext<BaseBetslipContextValue | null>(null)
export const DetailedBetslipContext = createContext<DetailedBetslipContextValue | null>(null)

export const useBaseBetslip = () => {
  return useContext(BaseBetslipContext) as BaseBetslipContextValue
}
export const useDetailedBetslip = () => {
  return useContext(DetailedBetslipContext) as DetailedBetslipContextValue
}

export type BetslipProviderProps = {
  children: React.ReactNode
  affiliate?: Address
  // isBatchBetWithSameGameEnabled?: boolean
}

export const BetslipProvider: React.FC<BetslipProviderProps> = (props) => {
  const { children, affiliate } = props

  const { appChain } = useChain()
  const account = useExtendedAccount()
  const { forceUpdate } = useForceUpdate()

  const [ items, setItems ] = useState<AzuroSDK.BetslipItem[]>([])
  const [ selectedFreebet, setFreebet ] = useState<Freebet>()
  const [ betAmount, setBetAmount ] = useState('')
  // const [ batchBetAmounts, setBatchBetAmounts ] = useState<Record<string, string>>({})
  // const [ isBatch, setBatch ] = useState(false)

  const { data: freebets, isFetching: isFreebetsFetching } = useAvailableFreebets({
    account: account?.address!,
    affiliate: affiliate!,
    selections: items,
    query: {
      enabled: Boolean(affiliate) && Boolean(account?.address) && Boolean(items.length),
    },
  })
  const { data: oddsData, isFetching: isOddsFetching } = useOdds({
    // betAmount,
    // batchBetAmounts,
    selections: items,
  })
  const { data: states, isFetching: isStatesFetching } = useConditionsState({
    conditionIds: items.map(({ conditionId }) => conditionId),
  })
  const { data: maxBet, isFetching: isMaxBetFetching } = useMaxBet({ selections: items })

  const { odds, totalOdds } = oddsData
  const isCombo = items.length > 1

  const checkDifferentGames = (items: AzuroSDK.BetslipItem[]) => {
    const gameIds = items.map(({ gameId }) => gameId)

    return gameIds.length === new Set(gameIds).size
  }

  // const createInitialBatchAmounts = (items: AzuroSDK.BetslipItem[]) => {
  //   setBatchBetAmounts(batchAmounts => {
  //     const newBatchAmounts: Record<string, string> = {}

  //     items.forEach(({ conditionId, outcomeId }) => {
  //       const key = `${conditionId}-${outcomeId}`

  //       newBatchAmounts[key] = batchAmounts[key] || ''
  //     })

  //     return newBatchAmounts
  //   })
  // }

  const totalBetAmount = useMemo(() => {
    // if (isBatch) {
    //   return String(Object.values(batchBetAmounts).reduce((acc, amount) => acc + +amount, 0))
    // }

    if (selectedFreebet) {
      return selectedFreebet.amount
    }

    return betAmount
  },
  // [ isBatch, betAmount, batchBetAmounts, selectedFreeBet ]
  [ betAmount, selectedFreebet ]
  )

  const isConditionsInActiveState = useMemo(() => {
    return Object.values(states).every(state => state === ConditionState.Active)
  }, [ states ])

  const isComboWithDifferentGames = useMemo(() => {
    return !isCombo || checkDifferentGames(items)
  }, [ isCombo, items ])

  const isFreeBetAllowed = useMemo(() => {
    if (!selectedFreebet) {
      return true
    }

    return selectedFreebet.expiresAt > Date.now()
  }, [ selectedFreebet ])

  const isComboAllowed = useMemo(() => {
    return !isCombo || isComboWithDifferentGames && items.every(({ isExpressForbidden }) => !isExpressForbidden)
  }, [ isCombo, items ])

  // const minBet = isLiveBet && !appChain?.testnet ? MIN_LIVE_BET_AMOUNT : undefined
  const minBet = undefined // TODO

  const isMaxBetBiggerThanZero = typeof maxBet !== 'undefined' ? +maxBet > 0 : true
  const isAmountLowerThanMaxBet = Boolean(betAmount) && typeof maxBet !== 'undefined' ? +betAmount <= +maxBet : true
  const isAmountBiggerThanMinBet = Boolean(betAmount) && typeof minBet !== 'undefined' ? +betAmount >= minBet : true

  const isBetAllowed = (
    isConditionsInActiveState
    && isComboAllowed
    && isFreeBetAllowed
    && isMaxBetBiggerThanZero
    && isAmountLowerThanMaxBet
    && isAmountBiggerThanMinBet
  )

  let disableReason = (() => {
    if (!isConditionsInActiveState) {
      return BetslipDisableReason.ConditionState
    }

    if (!isFreeBetAllowed) {
      return BetslipDisableReason.FreeBetExpired
    }

    if (!isComboAllowed) {
      if (!isComboWithDifferentGames) {
        return BetslipDisableReason.ComboWithSameGame
      }
      else {
        return BetslipDisableReason.ComboWithForbiddenItem
      }
    }

    if (!isMaxBetBiggerThanZero) {
      return BetslipDisableReason.SelectedOutcomesTemporarySuspended
    }

    if (!isAmountLowerThanMaxBet) {
      return BetslipDisableReason.BetAmountGreaterThanMaxBet
    }

    if (!isAmountBiggerThanMinBet) {
      return BetslipDisableReason.BetAmountLowerThanMinBet
    }
  })()

  // const changeBatch = useCallback((value: boolean) => {
  //   setBatch(value)

  //   if (value) {
  //     setBetAmount('')
  //     createInitialBatchAmounts(items)
  //   }
  //   else {
  //     setBatchBetAmounts({})
  //   }
  // }, [ items ])

  const changeBetAmount = useCallback((value: string) => {
    setBetAmount(value)
  }, [])

  // const changeBatchBetAmount = useCallback((item: ChangeBatchBetAmountItem, value: string) => {
  //   const { conditionId, outcomeId } = item
  //   const key = `${conditionId}-${outcomeId}`
  //   const decimals = ([ base.id, baseSepolia.id ] as number[]).includes(appChain.id) ? 4 : 2

  //   setBatchBetAmounts(amounts => {
  //     return {
  //       ...amounts,
  //       [key]: formatToFixed(value, decimals),
  //     }
  //   })
  // }, [ appChain ])

  const addItem = useCallback((item: AzuroSDK.BetslipItem) => {

    setItems(items => {
      let newItems: AzuroSDK.BetslipItem[]
      const replaceIndex = items.findIndex(({ gameId }) => gameId === item.gameId)

      // if cart contains outcome from same game as new item
      // then replace old item
      if (replaceIndex !== -1) {
        // if (isBatchBetWithSameGameEnabled) {
        //   const { conditionId, outcomeId } = items[replaceIndex]!

        //   // if it's exactly the same outcome, don't change the state
        //   if (conditionId === item.conditionId && outcomeId === item.outcomeId) {
        //     return items
        //   }

        //   newItems = [ ...items, item ]

        //   setBatch(true)
        //   createInitialBatchAmounts(newItems)
        // }
        // else {
        newItems = [ ...items ]
        newItems[replaceIndex] = item
        // }
      }
      else {
        newItems = [ ...items, item ]
      }

      localStorage.setItem(localStorageKeys.betslipItems, JSON.stringify(newItems))

      // if (isBatch) {
      //   createInitialBatchAmounts(newItems)
      // }

      return newItems
    })
  },
  // [ isBatch ]
  []
  )

  const removeItem = useCallback((itemProps: RemoveItemProps) => {
    const { conditionId, outcomeId } = itemProps

    setItems(items => {
      const newItems = items.filter((item) => !(
        item.conditionId === conditionId
        && item.outcomeId === outcomeId
      ))

      // if (newItems.length < 2) {
      //   setBatch(false)
      // }

      // setBatchBetAmounts(batchAmounts => {
      //   if (newItems.length < 2) {
      //     const lastItem = newItems[0]

      //     if (lastItem) {
      //       const { conditionId, outcomeId } = lastItem
      //       const amount = batchAmounts[`${conditionId}-${outcomeId}`]

      //       if (amount) {
      //         setBetAmount(amount)
      //       }
      //     }

      //     return {}
      //   }

      //   const newBatchAmounts = { ...batchAmounts }
      //   delete newBatchAmounts[`${conditionId}-${outcomeId}`]

      //   return newBatchAmounts
      // })

      localStorage.setItem(localStorageKeys.betslipItems, JSON.stringify(newItems))

      return newItems
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    // setBatch(false)
    // setBatchBetAmounts({})
    setBetAmount('')
    setFreebet(undefined)
    localStorage.setItem(localStorageKeys.betslipItems, JSON.stringify([]))
  }, [])

  const prevChainId = useRef(appChain.id)
  useEffect(() => {
    if (prevChainId.current !== appChain.id) {
      clear()
      prevChainId.current = appChain.id
    }
  }, [ appChain.id ])

  useEffect(() => {
    let storedItems: AzuroSDK.BetslipItem[] = JSON.parse(localStorage.getItem(localStorageKeys.betslipItems) || '[]')

    if (!Array.isArray(storedItems)) {
      return
    }

    // const isDifferentGames = checkDifferentGames(storedItems)

    // if (!isDifferentGames) {
    //   setBatch(true)
    //   createInitialBatchAmounts(storedItems)
    // }
    setItems(storedItems)
  }, [])

  useEffect(() => {
    if (!selectedFreebet || selectedFreebet.expiresAt <= Date.now()) {
      return
    }

    const timeout = setTimeout(() => {
      forceUpdate()
    }, selectedFreebet!.expiresAt - Date.now())

    return () => {
      clearTimeout(timeout)
    }
  }, [ selectedFreebet ])

  const baseValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    clear,
  }), [
    items,
    addItem,
    removeItem,
    clear,
  ])

  const detailedValue = useMemo(() => ({
    betAmount: totalBetAmount,
    // batchBetAmounts,
    odds,
    totalOdds,
    maxBet: +(maxBet || 0),
    minBet,
    selectedFreebet,
    freebets,
    states,
    disableReason,
    changeBetAmount,
    // changeBatchBetAmount,
    // changeBatch,
    selectFreebet: setFreebet,
    // isBatch,
    isStatesFetching,
    isOddsFetching,
    isFreebetsFetching,
    isMaxBetFetching,
    isBetAllowed,
  }), [
    totalBetAmount,
    // batchBetAmounts,
    odds,
    totalOdds,
    maxBet,
    minBet,
    selectedFreebet,
    freebets,
    states,
    disableReason,
    changeBetAmount,
    // changeBatchBetAmount,
    // changeBatch,
    setFreebet,
    // isBatch,
    isStatesFetching,
    isOddsFetching,
    isFreebetsFetching,
    isMaxBetFetching,
    isBetAllowed,
  ])

  return (
    <BaseBetslipContext.Provider value={baseValue}>
      <DetailedBetslipContext.Provider value={detailedValue}>
        {children}
      </DetailedBetslipContext.Provider>
    </BaseBetslipContext.Provider>
  )
}
