import React, { useContext, createContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useApolloClients } from './apollo'
import { MainGameInfoFragmentDoc, type MainGameInfoFragment } from '../docs/prematch/fragments/mainGameInfo'
import { liveCoreAddress, localStorageKeys } from '../config'
import { ApolloCache, NormalizedCacheObject } from '@apollo/client'
import { useChain } from './chain'
import { useCalcOdds } from '../hooks/useCalcOdds';


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
  conditionId: string
  outcomeId: string
  coreAddress: string
  lpAddress: string
  game: Game
  isExpressForbidden?: boolean
}

type ItemProps = {
  gameId: string
  conditionId: string
  outcomeId: string
  coreAddress: string
  lpAddress: string
  isExpressForbidden: boolean
}

export type BaseBetslipContextValue = {
  items: BetslipItem[]
  addItem: (itemProps: ItemProps) => void
  removeItem: (gameId: string) => void
  clear: () => void
}

export type DetailedBetslipContextValue = {
  amount: string
  odds: Record<string, number>
  totalOdds: number
  setAmount: (value: string) => void
  isStatusesFetching: boolean
  isOddsFetching: boolean
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
  const [ amount, setAmount ] = useState('')
  const { odds, totalOdds, loading: isOddsFetching } = useCalcOdds({ amount, selections: items })
  const [ isStatusesFetching, setStatusesFetching ] = useState(false)

  const addItem = useCallback((itemProps: ItemProps) => {
    const { gameId, coreAddress, lpAddress, ...data } = itemProps

    let game: MainGameInfoFragment | null
    let cache: ApolloCache<NormalizedCacheObject>
    let gameEntityId: string

    if (coreAddress === liveCoreAddress) {
      cache = liveClient!.cache
      gameEntityId = gameId
    } else {
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
        }
      }
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
      }
    } as BetslipItem

    setStatusesFetching(true)
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
      setStatusesFetching(Boolean(newItems.length))

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
    amount,
    odds,
    totalOdds,
    setAmount,
    isStatusesFetching,
    isOddsFetching,
  }), [
    amount,
    odds,
    totalOdds,
    isStatusesFetching,
    isOddsFetching
  ])

  return (
    <BaseBetslipContext.Provider value={baseValue}>
      <DetailedBetslipContext.Provider value={detailedValue}>
        {children}
      </DetailedBetslipContext.Provider>
    </BaseBetslipContext.Provider>
  )
}
