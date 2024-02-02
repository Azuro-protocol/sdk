import React, { useContext, createContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { ApolloCache, NormalizedCacheObject } from '@apollo/client'

import { useApolloClients } from './apollo'
import { MainGameInfoFragmentDoc, type MainGameInfoFragment } from '../docs/prematch/fragments/mainGameInfo'
import { liveHostAddress, localStorageKeys } from '../config'
import { useChain } from './chain'
import { useOdds } from '../hooks/useOdds'
import { useStatuses } from '../hooks/useStatuses'
import { ConditionStatus } from '../docs/live/types'
import { type Selection } from '../global'


export enum BetslipDisableReason {
  ConditionStatus = 'ConditionStatus',
  BetAmountGreaterThanMaxBet = 'BetAmountGreaterThanMaxBet',
  ComboWithLive = 'ComboWithLive',
  ComboWithForbiddenItem = 'ComboWithForbiddenItem',
  PrematchConditionInStartedGame = 'PrematchConditionInStartedGame',
}

type Game = {
  gameId: string
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

type BetslipItem = {
  lpAddress: string
  game: Game
  isExpressForbidden: boolean
} & Selection

type ItemProps = {
  gameId: string
  lpAddress: string
  isExpressForbidden: boolean
} & Selection

export type BaseBetslipContextValue = {
  items: BetslipItem[]
  addItem: (itemProps: ItemProps) => void
  removeItem: (gameId: string) => void
  clear: () => void
}

export type DetailedBetslipContextValue = {
  betAmount: string
  odds: Record<string, number>
  totalOdds: number
  maxBet?: number
  statuses: Record<string, ConditionStatus>
  disableReason: BetslipDisableReason | undefined
  changeBetAmount: (value: string) => void
  isStatusesFetching: boolean
  isOddsFetching: boolean
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

type Props = {
  children: React.ReactNode
}

export const BetslipProvider: React.FC<Props> = (props) => {
  const { children } = props

  const { prematchClient, liveClient } = useApolloClients()
  const { appChain } = useChain()
  const [ items, setItems ] = useState<BetslipItem[]>([])
  const [ betAmount, setBetAmount ] = useState('')
  const { odds, totalOdds, maxBet, loading: isOddsFetching } = useOdds({ betAmount, selections: items })
  const { statuses, loading: isStatusesFetching } = useStatuses({ selections: items })

  const isCombo = items.length > 1

  const isLiveBet = useMemo(() => {
    return items.some(({ coreAddress }) => coreAddress === liveHostAddress)
  }, [ items ])

  const isConditionsInCreatedStatus = useMemo(() => {
    return Object.values(statuses).every(status => status === ConditionStatus.Created)
  }, [ statuses ])

  const isComboAllowed = useMemo(() => {
    return !isCombo || !isLiveBet && items.every(({ isExpressForbidden }) => !isExpressForbidden)
  }, [ items ])

  const isPrematchBetAllowed = useMemo(() => {
    return items.every(({ coreAddress, game: { startsAt } }) => {
      if (coreAddress === liveHostAddress) {
        return true
      }

      return startsAt * 1000 > Date.now()
    })
  }, [ items ])

  const isAmountLowerThanMaxBet = Boolean(betAmount) && typeof maxBet !== 'undefined' ? +betAmount <= maxBet : true

  const isBetAllowed = isConditionsInCreatedStatus && isComboAllowed && isPrematchBetAllowed && isAmountLowerThanMaxBet

  let disableReason: BetslipDisableReason | undefined = undefined

  if (!isConditionsInCreatedStatus) {
    disableReason = BetslipDisableReason.ConditionStatus
  }

  if (isCombo && !isComboAllowed) {
    if (isLiveBet) {
      disableReason = BetslipDisableReason.ComboWithLive
    }
    else {
      disableReason = BetslipDisableReason.ComboWithForbiddenItem
    }
  }

  if (!isPrematchBetAllowed) {
    disableReason = BetslipDisableReason.PrematchConditionInStartedGame
  }

  if (!isAmountLowerThanMaxBet) {
    disableReason = BetslipDisableReason.BetAmountGreaterThanMaxBet
  }

  const changeBetAmount = (value: string) => {
    const [ int, digits ] = value.split('.')

    if (digits) {
      value = `${int}.${digits.substring(0, 2)}`
    }

    setBetAmount(value)
  }

  const addItem = useCallback((itemProps: ItemProps) => {
    const { gameId, coreAddress, lpAddress } = itemProps

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

    const {
      participants,
      startsAt: _startsAt,
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
      game: {
        gameId,
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
        newItems = [ ...items ]
        newItems[replaceIndex] = item
      }
      else {
        newItems = [ ...items, item ]
      }

      localStorage.setItem(localStorageKeys.betslipItems, JSON.stringify(newItems))

      return newItems
    })
  }, [])

  const removeItem = useCallback((gameId: string) => {
    setItems(items => {
      const newItems = items.filter((item) => item.game.gameId !== gameId)

      localStorage.setItem(localStorageKeys.betslipItems, JSON.stringify(newItems))

      return newItems
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
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

    setItems(storedItems)
  }, [])

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
    betAmount,
    odds,
    totalOdds,
    maxBet,
    statuses,
    disableReason,
    changeBetAmount,
    isStatusesFetching,
    isOddsFetching,
    isBetAllowed,
  }), [
    betAmount,
    odds,
    totalOdds,
    maxBet,
    statuses,
    disableReason,
    changeBetAmount,
    isStatusesFetching,
    isOddsFetching,
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
