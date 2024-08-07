import React, { useContext, createContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { ApolloCache, NormalizedCacheObject } from '@apollo/client'
import {
  type Selection,
  type MainGameInfoFragment,
  type PrematchConditionFragment,

  ConditionStatus,
  MIN_LIVE_BET_AMOUNT,
  liveHostAddress,
  MainGameInfoFragmentDoc,
  PrematchConditionFragmentDoc,
} from '@azuro-org/toolkit'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'

import { useApolloClients } from './apollo'
import { localStorageKeys } from '../config'
import { useChain } from './chain'
import { useOdds } from '../hooks/watch/useOdds'
import { useStatuses } from '../hooks/watch/useStatuses'
import { type FreeBet, useFreeBets } from '../hooks/data/useFreeBets'
import { formatBetValue } from '../helpers/formatBetValue'
import useForceUpdate from '../helpers/hooks/useForceUpdate'


export enum BetslipDisableReason {
  ConditionStatus = 'ConditionStatus',
  BetAmountGreaterThanMaxBet = 'BetAmountGreaterThanMaxBet',
  BetAmountLowerThanMinBet = 'BetAmountLowerThanMinBet',
  BatchWithLive = 'BatchWithLive',
  ComboWithLive = 'ComboWithLive',
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
  lpAddress: string
  game: Game
  isExpressForbidden: boolean
  marketName: string
  selectionName: string
} & Selection

type AddItemProps = {
  gameId: string
  lpAddress: string
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
  statuses: Record<string, ConditionStatus>
  disableReason: BetslipDisableReason | undefined
  changeBetAmount: (value: string) => void
  changeBatchBetAmount: (item: ChangeBatchBetAmountItem, value: string) => void
  changeBatch: (value: boolean) => void
  selectFreeBet: (value?: FreeBet) => void
  isLiveBet: boolean
  isBatch: boolean
  isStatusesFetching: boolean
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

  const { prematchClient, liveClient } = useApolloClients()
  const { appChain } = useChain()
  const account = useAccount()
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
  const { odds, totalOdds, maxBet, loading: isOddsFetching } = useOdds({ betAmount, batchBetAmounts, selections: items })
  const { statuses, loading: isStatusesFetching } = useStatuses({ selections: items })

  const isCombo = !isBatch && items.length > 1

  const checkDifferentGames = (items: BetslipItem[]) => {
    const gameIds = items.map(({ game }) => game.gameId)

    return gameIds.length === new Set(gameIds).size
  }

  const createInitialBatchAmounts = (items: BetslipItem[]) => {
    setBatchBetAmounts(batchAmounts => {
      const newBatchAmounts = { ...batchAmounts }

      items.forEach(({ conditionId, outcomeId }) => {
        const key = `${conditionId}-${outcomeId}`

        if (typeof newBatchAmounts[key] === 'undefined') {
          newBatchAmounts[key] = ''
        }
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

  const isLiveBet = useMemo(() => {
    return items.some(({ coreAddress }) => coreAddress === liveHostAddress)
  }, [ items ])

  const isConditionsInCreatedStatus = useMemo(() => {
    return Object.values(statuses).every(status => status === ConditionStatus.Created)
  }, [ statuses ])

  const isComboWithDifferentGames = useMemo(() => {
    return !isCombo || checkDifferentGames(items)
  }, [ isCombo, items ])

  const isBatchAllowed = !isBatch || !isLiveBet

  const isFreeBetAllowed = useMemo(() => {
    if (!selectedFreeBet || !totalOdds) {
      return true
    }

    return (
      !isCombo && !isBatch && !isLiveBet
      && selectedFreeBet.expiresAt > Date.now()
      && totalOdds >= parseFloat(selectedFreeBet.minOdds)
    )
  }, [ selectedFreeBet, isCombo, isBatch, isLiveBet, totalOdds ])

  const isComboAllowed = useMemo(() => {
    return !isCombo || !isLiveBet && isComboWithDifferentGames && items.every(({ isExpressForbidden }) => !isExpressForbidden)
  }, [ isCombo, items ])

  const isPrematchBetAllowed = useMemo(() => {
    return items.every(({ coreAddress, game: { startsAt } }) => {
      if (coreAddress === liveHostAddress) {
        return true
      }

      return startsAt * 1000 > Date.now()
    })
  }, [ items ])

  const minBet = isLiveBet && !appChain?.testnet ? MIN_LIVE_BET_AMOUNT : undefined

  const isAmountLowerThanMaxBet = Boolean(betAmount) && typeof maxBet !== 'undefined' ? +betAmount <= maxBet : true
  const isAmountBiggerThanMinBet = Boolean(betAmount) && typeof minBet !== 'undefined' ? +betAmount >= minBet : true

  const isBetAllowed = (
    isConditionsInCreatedStatus
    && isComboAllowed
    && isBatchAllowed
    && isPrematchBetAllowed
    && isFreeBetAllowed
    && isAmountLowerThanMaxBet
    && isAmountBiggerThanMinBet
  )

  let disableReason = (() => {
    if (!isConditionsInCreatedStatus) {
      return BetslipDisableReason.ConditionStatus
    }

    if (!isFreeBetAllowed) {
      if (isLiveBet) {
        return BetslipDisableReason.FreeBetWithLive
      }
      else {
        if (isCombo) {
          return BetslipDisableReason.FreeBetWithCombo
        }

        if (isBatch) {
          return BetslipDisableReason.FreeBetWithBatch
        }
      }

      if (selectedFreeBet!.expiresAt <= Date.now()) {
        return BetslipDisableReason.FreeBetExpired
      }

      if (totalOdds < parseFloat(selectedFreeBet!.minOdds)) {
        return BetslipDisableReason.FreeBetMinOdds
      }
    }

    if (!isComboAllowed) {
      if (isLiveBet) {
        return BetslipDisableReason.ComboWithLive
      }
      else if (!isComboWithDifferentGames) {
        return BetslipDisableReason.ComboWithSameGame
      }
      else {
        return BetslipDisableReason.ComboWithForbiddenItem
      }
    }

    if (!isPrematchBetAllowed) {
      return BetslipDisableReason.PrematchConditionInStartedGame
    }

    if (!isBatchAllowed) {
      return BetslipDisableReason.BatchWithLive
    }

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
    setBetAmount(formatBetValue(value))
  }, [])

  const changeBatchBetAmount = useCallback((item: ChangeBatchBetAmountItem, value: string) => {
    const { conditionId, outcomeId } = item
    const key = `${conditionId}-${outcomeId}`

    setBatchBetAmounts(amounts => {
      return {
        ...amounts,
        [key]: formatBetValue(value),
      }
    })
  }, [])

  const addItem = useCallback((itemProps: AddItemProps) => {
    const { gameId, coreAddress, lpAddress, conditionId, outcomeId } = itemProps

    let game: MainGameInfoFragment | null
    let cache: ApolloCache<NormalizedCacheObject>
    let gameEntityId: string

    if (coreAddress === liveHostAddress) {
      cache = liveClient!.cache
      gameEntityId = gameId
    }
    else {
      cache = prematchClient!.cache
      gameEntityId = `${lpAddress.toLowerCase()}_${gameId}`
    }

    game = cache.readFragment<MainGameInfoFragment>({
      id: cache.identify({ __typename: 'Game', id: gameEntityId }),
      fragment: MainGameInfoFragmentDoc,
      fragmentName: 'MainGameInfo',
    })

    if (!game) {
      return
    }

    let marketName = getMarketName({ outcomeId })
    let selectionName = getSelectionName({ outcomeId, withPoint: true })

    if (coreAddress !== liveHostAddress) {
      const conditionEntityId = `${coreAddress.toLowerCase()}_${conditionId}`
      const condition = cache.readFragment<PrematchConditionFragment>({
        id: cache.identify({ __typename: 'Condition', id: conditionEntityId }),
        fragment: PrematchConditionFragmentDoc,
        fragmentName: 'PrematchCondition',
      })

      if (condition?.title && condition.title !== 'null') {
        marketName = condition.title

        const outcome = condition.outcomes.find(outcome => outcome.outcomeId === outcomeId)

        if (outcome?.title && outcome.title !== 'null') {
          selectionName = outcome.title
        }
      }
    }

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

      return newItems
    })
  }, [])

  const removeItem = useCallback((itemProps: RemoveItemProps) => {
    const { conditionId, outcomeId } = itemProps

    setItems(items => {
      const newItems = items.filter((item) => !(
        item.conditionId === conditionId
        && item.outcomeId === outcomeId
      ))

      if (newItems.length < 2) {
        setBatch(false)

        setBatchBetAmounts(batchAmounts => {
          const lastItem = newItems[0]

          if (lastItem) {
            const { conditionId, outcomeId } = lastItem
            const amount = batchAmounts[`${conditionId}-${outcomeId}`]

            if (amount) {
              setBetAmount(amount)
            }
          }

          return {}
        })
      }
      else {
        setBatchBetAmounts(batchAmounts => {
          const newBatchAmounts = { ...batchAmounts }
          delete newBatchAmounts[`${conditionId}-${outcomeId}`]

          return newBatchAmounts
        })
      }

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
    statuses,
    disableReason,
    changeBetAmount,
    changeBatchBetAmount,
    changeBatch,
    selectFreeBet: setFreeBet,
    isBatch,
    isLiveBet,
    isStatusesFetching,
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
    statuses,
    disableReason,
    changeBetAmount,
    changeBatchBetAmount,
    changeBatch,
    setFreeBet,
    isBatch,
    isLiveBet,
    isStatusesFetching,
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
