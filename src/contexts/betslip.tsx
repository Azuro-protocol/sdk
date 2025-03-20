import React, { useContext, createContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { ApolloCache, NormalizedCacheObject } from '@apollo/client'
import {
  type Selection,
  type GameInfoFragment,
  type ConditionFragment,

  ConditionState,
  MIN_LIVE_BET_AMOUNT,
  liveHostAddress,
  GameInfoFragmentDoc,
  ConditionFragmentDoc,
} from '@azuro-org/toolkit'
import { type Address } from 'viem'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import { base, baseSepolia } from 'viem/chains'

import { localStorageKeys } from '../config'
import { useChain } from './chain'
import { formatToFixed } from '../helpers/formatToFixed'
import { useOdds } from '../hooks/watch/useOdds'
import { useSelectionsState } from '../hooks/watch/useSelectionsState'
import { type FreeBet, useFreeBets } from '../hooks/data/useFreeBets'
import useForceUpdate from '../helpers/hooks/useForceUpdate'
import { useExtendedAccount } from '../hooks/useAaConnector'


export enum BetslipDisableReason {
  ConditionState = 'ConditionState',
  BetAmountGreaterThanMaxBet = 'BetAmountGreaterThanMaxBet',
  BetAmountLowerThanMinBet = 'BetAmountLowerThanMinBet',
  ComboWithForbiddenItem = 'ComboWithForbiddenItem',
  ComboWithSameGame = 'ComboWithSameGame',
  PrematchConditionInStartedGame = 'PrematchConditionInStartedGame',
  FreeBetWithLive = 'FreeBetWithLive',
  FreeBetWithCombo = 'FreeBetWithCombo',
  FreeBetWithBatch = 'FreeBetWithBatch',
  FreeBetExpired = 'FreeBetExpired',
  FreeBetMinOdds = 'FreeBetMinOdds',
}

type Game = {
  gameId: string
  title: string
  countryName: string
  countrySlug: string
  leagueName: string
  leagueSlug: string
  participants: Array<{
    name: string
    image?: string
  }>
  startsAt: number
  sportId: number
  sportSlug: string
  sportName: string
}

export type BetslipItem = {
  // lpAddress: string
  game: Game
  isExpressForbidden: boolean
  marketName: string
  selectionName: string
} & Selection

type AddItemProps = {
  gameId: string
  // lpAddress: string
  isExpressForbidden: boolean
} & Selection

type RemoveItemProps = Omit<Selection, 'coreAddress'>

type ChangeBatchBetAmountItem = Omit<Selection, 'coreAddress'>

export type BaseBetslipContextValue = {
  items: BetslipItem[]
  addItem: (itemProps: AddItemProps) => void
  removeItem: (itemProps: RemoveItemProps) => void
  clear: () => void
}

export type DetailedBetslipContextValue = {
  betAmount: string
  batchBetAmounts: Record<string, string>
  odds: Record<string, number>
  totalOdds: number
  maxBet: number | undefined
  minBet: number | undefined
  selectedFreeBet: FreeBet | undefined
  freeBets: FreeBet[] | undefined | null
  states: Record<string, ConditionState>
  disableReason: BetslipDisableReason | undefined
  changeBetAmount: (value: string) => void
  changeBatchBetAmount: (item: ChangeBatchBetAmountItem, value: string) => void
  changeBatch: (value: boolean) => void
  selectFreeBet: (value?: FreeBet) => void
  isBatch: boolean
  isStatesFetching: boolean
  isOddsFetching: boolean
  isFreeBetsFetching: boolean
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
  isBatchBetWithSameGameEnabled?: boolean
}

export const BetslipProvider: React.FC<BetslipProviderProps> = (props) => {
  const { children, affiliate, isBatchBetWithSameGameEnabled } = props

  const { appChain } = useChain()
  const account = useExtendedAccount()
  const { forceUpdate } = useForceUpdate()

  const [ items, setItems ] = useState<BetslipItem[]>([])
  const [ selectedFreeBet, setFreeBet ] = useState<FreeBet>()
  const [ betAmount, setBetAmount ] = useState('')
  const [ batchBetAmounts, setBatchBetAmounts ] = useState<Record<string, string>>({})
  const [ isBatch, setBatch ] = useState(false)

  const { data: freeBets, isFetching: isFreeBetsFetching } = useFreeBets({
    account: account.address!,
    affiliate: affiliate!,
    enabled: Boolean(affiliate),
  })
  const { odds, totalOdds, maxBet, isFetching: isOddsFetching } = useOdds({ betAmount, batchBetAmounts, selections: items })
  const { states, isFetching: isStatesFetching } = useSelectionsState({ selections: items })

  const isCombo = !isBatch && items.length > 1

  const checkDifferentGames = (items: BetslipItem[]) => {
    const gameIds = items.map(({ game }) => game.gameId)

    return gameIds.length === new Set(gameIds).size
  }

  const createInitialBatchAmounts = (items: BetslipItem[]) => {
    setBatchBetAmounts(batchAmounts => {
      const newBatchAmounts: Record<string, string> = {}

      items.forEach(({ conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`

        newBatchAmounts[key] = batchAmounts[key] || ''
      })

      return newBatchAmounts
    })
  }

  const totalBetAmount = useMemo(() => {
    if (isBatch) {
      return String(Object.values(batchBetAmounts).reduce((acc, amount) => acc + +amount, 0))
    }

    if (selectedFreeBet) {
      return selectedFreeBet.amount
    }

    return betAmount
  }, [ isBatch, betAmount, batchBetAmounts, selectedFreeBet ])

  // const isLiveBet = useMemo(() => {
  //   return items.some(({ coreAddress }) => coreAddress === liveHostAddress)
  // }, [ items ])

  const isConditionsInActiveState = useMemo(() => {
    return Object.values(states).every(state => state === ConditionState.Active)
  }, [ states ])

  const isComboWithDifferentGames = useMemo(() => {
    return !isCombo || checkDifferentGames(items)
  }, [ isCombo, items ])

  // const isFreeBetAllowed = useMemo(() => {
  //   if (!selectedFreeBet || !totalOdds) {
  //     return true
  //   }

  //   return (
  //     !isCombo && !isBatch && !isLiveBet
  //     && selectedFreeBet.expiresAt > Date.now()
  //     && totalOdds >= parseFloat(selectedFreeBet.minOdds)
  //   )
  // }, [ selectedFreeBet, isCombo, isBatch, isLiveBet, totalOdds ])

  const isComboAllowed = useMemo(() => {
    return !isCombo || isComboWithDifferentGames && items.every(({ isExpressForbidden }) => !isExpressForbidden)
  }, [ isCombo, items ])

  // const isPrematchBetAllowed = useMemo(() => {
  //   return items.every(({ game: { startsAt } }) => {

  //     return startsAt * 1000 > Date.now()
  //   })
  // }, [ items ])

  // const minBet = isLiveBet && !appChain?.testnet ? MIN_LIVE_BET_AMOUNT : undefined
  const minBet = undefined

  const isAmountLowerThanMaxBet = Boolean(betAmount) && typeof maxBet !== 'undefined' ? +betAmount <= maxBet : true
  const isAmountBiggerThanMinBet = Boolean(betAmount) && typeof minBet !== 'undefined' ? +betAmount >= minBet : true

  const isBetAllowed = (
    isConditionsInActiveState
    && isComboAllowed
    // && isPrematchBetAllowed
    // && isFreeBetAllowed
    && isAmountLowerThanMaxBet
    && isAmountBiggerThanMinBet
  )

  let disableReason = (() => {
    if (!isConditionsInActiveState) {
      return BetslipDisableReason.ConditionState
    }

    // if (!isFreeBetAllowed) {
    //   if (isLiveBet) {
    //     return BetslipDisableReason.FreeBetWithLive
    //   }
    //   else {
    //     if (isCombo) {
    //       return BetslipDisableReason.FreeBetWithCombo
    //     }

    //     if (isBatch) {
    //       return BetslipDisableReason.FreeBetWithBatch
    //     }
    //   }

    //   if (selectedFreeBet!.expiresAt <= Date.now()) {
    //     return BetslipDisableReason.FreeBetExpired
    //   }

    //   if (totalOdds < parseFloat(selectedFreeBet!.minOdds)) {
    //     return BetslipDisableReason.FreeBetMinOdds
    //   }
    // }

    if (!isComboAllowed) {
      if (!isComboWithDifferentGames) {
        return BetslipDisableReason.ComboWithSameGame
      }
      else {
        return BetslipDisableReason.ComboWithForbiddenItem
      }
    }

    // if (!isPrematchBetAllowed) {
    //   return BetslipDisableReason.PrematchConditionInStartedGame
    // }

    if (!isAmountLowerThanMaxBet) {
      return BetslipDisableReason.BetAmountGreaterThanMaxBet
    }

    if (!isAmountBiggerThanMinBet) {
      return BetslipDisableReason.BetAmountLowerThanMinBet
    }
  })()

  const changeBatch = useCallback((value: boolean) => {
    setBatch(value)

    if (value) {
      setBetAmount('')
      createInitialBatchAmounts(items)
    }
    else {
      setBatchBetAmounts({})
    }
  }, [ items ])

  const changeBetAmount = useCallback((value: string) => {
    const decimals = ([ base.id, baseSepolia.id ] as number[]).includes(appChain.id) ? 4 : 2

    setBetAmount(formatToFixed(value, decimals))
  }, [ appChain ])

  const changeBatchBetAmount = useCallback((item: ChangeBatchBetAmountItem, value: string) => {
    const { conditionId, outcomeId } = item
    const key = `${conditionId}-${outcomeId}`
    const decimals = ([ base.id, baseSepolia.id ] as number[]).includes(appChain.id) ? 4 : 2

    setBatchBetAmounts(amounts => {
      return {
        ...amounts,
        [key]: formatToFixed(value, decimals),
      }
    })
  }, [ appChain ])

  const addItem = useCallback((itemProps: AddItemProps) => {
    const { gameId, conditionId, outcomeId } = itemProps

    let game: GameInfoFragment | null = null
    let cache: ApolloCache<NormalizedCacheObject>
    let gameEntityId: string

    // if (coreAddress === liveHostAddress) {
    //   cache = liveClient!.cache
    //   gameEntityId = gameId
    // }
    // else {
    //   cache = prematchClient!.cache
    //   gameEntityId = `${lpAddress.toLowerCase()}_${gameId}`
    // }

    // game = cache.readFragment<MainGameInfoFragment>({
    //   id: cache.identify({ __typename: 'Game', id: gameEntityId }),
    //   fragment: MainGameInfoFragmentDoc,
    //   fragmentName: 'MainGameInfo',
    // })

    if (!game) {
      return
    }

    let marketName = getMarketName({ outcomeId })
    let selectionName = getSelectionName({ outcomeId, withPoint: true })

    // if (coreAddress !== liveHostAddress) {
    //   const conditionEntityId = `${coreAddress.toLowerCase()}_${conditionId}`
    //   const condition = cache.readFragment<ConditionFragment>({
    //     id: cache.identify({ __typename: 'Condition', id: conditionEntityId }),
    //     fragment: ConditionFragmentDoc,
    //     fragmentName: 'Condition',
    //   })

    //   if (condition?.title && condition.title !== 'null') {
    //     marketName = condition.title

    //     const outcome = condition.outcomes.find(outcome => outcome.outcomeId === outcomeId)

    //     if (outcome?.title && outcome.title !== 'null') {
    //       selectionName = outcome.title
    //     }
    //   }
    // }

    const {
      participants,
      startsAt: _startsAt,
      title,
      sport: {
        sportId: _sportId,
        slug: sportSlug,
        name: sportName,
      },
      league: {
        name: leagueName,
        slug: leagueSlug,
        country: {
          name: countryName,
          slug: countrySlug,
        },
      },
    } = game

    const item = {
      ...itemProps,
      marketName,
      selectionName,
      game: {
        gameId,
        title,
        countryName,
        countrySlug,
        leagueName,
        leagueSlug,
        participants,
        startsAt: +_startsAt,
        sportId: +_sportId,
        sportSlug,
        sportName,
      },
    } as BetslipItem

    setItems(items => {
      let newItems: BetslipItem[]
      const replaceIndex = items.findIndex(({ game: { gameId } }) => gameId === item.game.gameId)

      // if cart contains outcome from same game as new item
      // then replace old item
      if (replaceIndex !== -1) {
        if (isBatchBetWithSameGameEnabled) {
          const { conditionId, outcomeId } = items[replaceIndex]!

          // if it's exactly the same outcome, don't change the state
          if (conditionId === item.conditionId && outcomeId === item.outcomeId) {
            return items
          }

          newItems = [ ...items, item ]

          setBatch(true)
          createInitialBatchAmounts(newItems)
        }
        else {
          newItems = [ ...items ]
          newItems[replaceIndex] = item
        }
      }
      else {
        newItems = [ ...items, item ]
      }

      localStorage.setItem(localStorageKeys.betslipItems, JSON.stringify(newItems))

      if (isBatch) {
        createInitialBatchAmounts(newItems)
      }

      return newItems
    })
  }, [ isBatch ])

  const removeItem = useCallback((itemProps: RemoveItemProps) => {
    const { conditionId, outcomeId } = itemProps

    setItems(items => {
      const newItems = items.filter((item) => !(
        item.conditionId === conditionId
        && item.outcomeId === outcomeId
      ))

      if (newItems.length < 2) {
        setBatch(false)
      }

      setBatchBetAmounts(batchAmounts => {
        if (newItems.length < 2) {
          const lastItem = newItems[0]

          if (lastItem) {
            const { conditionId, outcomeId } = lastItem
            const amount = batchAmounts[`${conditionId}-${outcomeId}`]

            if (amount) {
              setBetAmount(amount)
            }
          }

          return {}
        }

        const newBatchAmounts = { ...batchAmounts }
        delete newBatchAmounts[`${conditionId}-${outcomeId}`]

        return newBatchAmounts
      })

      localStorage.setItem(localStorageKeys.betslipItems, JSON.stringify(newItems))

      return newItems
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    setBatch(false)
    setBatchBetAmounts({})
    setBetAmount('')
    setFreeBet(undefined)
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
    let storedItems: BetslipItem[] = JSON.parse(localStorage.getItem(localStorageKeys.betslipItems) || '[]')

    if (!Array.isArray(storedItems)) {
      return
    }

    const isDifferentGames = checkDifferentGames(storedItems)

    if (!isDifferentGames) {
      setBatch(true)
      createInitialBatchAmounts(storedItems)
    }
    setItems(storedItems)
  }, [])

  useEffect(() => {
    if (!selectedFreeBet || selectedFreeBet!.expiresAt <= Date.now()) {
      return
    }

    const timeout = setTimeout(() => {
      disableReason = BetslipDisableReason.FreeBetExpired
      forceUpdate()
    }, selectedFreeBet!.expiresAt - Date.now())

    return () => {
      clearTimeout(timeout)
    }
  }, [ selectedFreeBet ])

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
    batchBetAmounts,
    odds,
    totalOdds,
    maxBet,
    minBet,
    selectedFreeBet,
    freeBets,
    states,
    disableReason,
    changeBetAmount,
    changeBatchBetAmount,
    changeBatch,
    selectFreeBet: setFreeBet,
    isBatch,
    isStatesFetching,
    isOddsFetching,
    isFreeBetsFetching,
    isBetAllowed,
  }), [
    totalBetAmount,
    batchBetAmounts,
    odds,
    totalOdds,
    maxBet,
    minBet,
    selectedFreeBet,
    freeBets,
    states,
    disableReason,
    changeBetAmount,
    changeBatchBetAmount,
    changeBatch,
    setFreeBet,
    isBatch,
    isStatesFetching,
    isOddsFetching,
    isFreeBetsFetching,
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
