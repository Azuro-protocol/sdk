import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { type GameState } from '@azuro-org/toolkit'

import { createQueueAction } from '../helpers/createQueueAction'
import { gameWathcer } from '../modules/gameWathcer'
import { useChain } from './chain'
import { useFeedSocket } from './feedSocket'


export type GameUpdatesContextValue = {
  isSocketReady: boolean
  subscribeToUpdates: (gameIds: string[]) => void
  unsubscribeToUpdates: (gameIds: string[]) => void
}

enum Event {
  Subscribe = 'SubscribeGames',
  Unsubscribe = 'UnsubscribeGames',
  Update = 'GameUpdated',
}

export type GameData = {
  id: string // gameId
  sportId: number
  country: string
  league: string
  state: GameState
  startsAt: number
  participants: string[]
  title: string | null
}

export type SocketData = {
  event: string
  data: GameData
}

export type GameUpdatedData = GameData

const GameUpdatesContext = createContext<GameUpdatesContextValue | null>(null)

export const useGameUpdates = () => {
  return useContext(GameUpdatesContext) as GameUpdatesContextValue
}

export const GameUpdatesProvider: React.FC<any> = ({ children }) => {
  const { environment } = useChain()
  const { socket, isSocketReady } = useFeedSocket()

  const subscribers = useRef<Record<string, number>>({})

  const subscribe = useCallback((weights: Record<string, number>) => {
    if (socket?.readyState !== 1) {
      return
    }

    const newSubscribers: string[] = []

    Object.keys(weights).forEach((conditionId) => {
      if (typeof subscribers.current[conditionId] === 'undefined') {
        newSubscribers.push(conditionId)
        subscribers.current[conditionId] = 0
      }

      subscribers.current[conditionId] += weights[conditionId]!
    })

    if (!newSubscribers.length) {
      return
    }

    socket.send(JSON.stringify({
      event: Event.Subscribe,
      data: {
        gameIds: Object.keys(weights),
        environment,
      },
    }))
  }, [ socket, environment ])

  const unsubscribeCall = useCallback((gameIds: string[]) => {
    if (socket?.readyState !== 1) {
      return
    }

    socket.send(JSON.stringify({
      event: Event.Unsubscribe,
      data: {
        gameIds,
        environment,
      },
    }))
  }, [ socket, environment ])

  const unsubscribe = useCallback((weights: Record<string, number>) => {
    if (socket?.readyState !== 1) {
      return
    }

    // we mustn't unsubscribe for condition if it has more that 1 subscriber
    const newUnsubscribers: string[] = []

    Object.keys(weights).forEach((gameId) => {
      if (subscribers.current[gameId]) {
        subscribers.current[gameId] += weights[gameId]!

        if (subscribers.current[gameId] === 0) {
          delete subscribers.current[gameId]
          newUnsubscribers.push(gameId)
        }
      }
    })

    if (!newUnsubscribers.length) {
      return
    }

    unsubscribeCall(newUnsubscribers)
  }, [ socket, unsubscribeCall ])

  const runAction = useCallback(createQueueAction(subscribe, unsubscribe), [ subscribe, unsubscribe ])

  const subscribeToUpdates = useCallback((gameIds: string[]) => {
    runAction('subscribe', gameIds)
  }, [ runAction ])

  const unsubscribeToUpdates = useCallback((gameIds: string[]) => {
    runAction('unsubscribe', gameIds)
  }, [ runAction ])

  useEffect(() => {
    if (!isSocketReady || !socket) {
      return
    }

    const handleMessage = (message: MessageEvent<string>) => {
      const { event, data }: SocketData = JSON.parse(message.data)

      if (event !== Event.Update) {
        return
      }

      const { id: gameId } = data

      gameWathcer.dispatch(gameId, data)
    }

    const handleClose = () => {
      subscribers.current = {}
    }

    socket.addEventListener('message', handleMessage)
    socket.addEventListener('close', handleClose)

    return () => {
      socket.removeEventListener('message', handleMessage)
      socket.removeEventListener('close', handleClose)

      if (socket.readyState !== WebSocket.OPEN) {
        subscribers.current = {}
      }
    }
  }, [ socket ])

  const value: GameUpdatesContextValue = {
    isSocketReady,
    subscribeToUpdates,
    unsubscribeToUpdates,
  }

  return (
    <GameUpdatesContext.Provider value={value}>
      {children}
    </GameUpdatesContext.Provider>
  )
}
