import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { type ConditionState } from '@azuro-org/toolkit'

import { createQueueAction } from '../helpers/createQueueAction'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { oddsWatcher } from '../modules/oddsWatcher'
import { useChain } from './chain'
import { useFeedSocket } from './feedSocket'


export type ConditionUpdatesContextValue = {
  isSocketReady: boolean
  subscribeToUpdates: (conditionIds: string[]) => void
  unsubscribeToUpdates: (conditionIds: string[]) => void
}

export type ConditionData = {
  id: string, // conditionId
  gameId: string,
  maxConditionPayout: string,
  maxOutcomePayout: string,
  maxLiveConditionPayout: string,
  maxLiveOutcomePayout: string,
  isPrematchEnabled: boolean,
  isLiveEnabled: boolean,
  state: ConditionState,
  outcomes: {
    outcomeId: number,
    title: string | null,
    currentOdds: string
  }[]
}

export type SocketData = {
  event: string
  data: ConditionData
}

const CONDITION_UPDATED_EVENT = 'ConditionUpdated'

export type OddsChangedData = {
  conditionId: string
  // margin: number
  // reinforcement: number
  // winningOutcomesCount: number
  outcomes: Record<string, {
    odds: number
    // clearOdds: number
    // maxBet: number
  }>
}

const ConditionUpdatesContext = createContext<ConditionUpdatesContextValue | null>(null)

export const useConditionUpdates = () => {
  return useContext(ConditionUpdatesContext) as ConditionUpdatesContextValue
}

export const ConditionUpdatesProvider: React.FC<any> = ({ children }) => {
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
      event: 'SubscribeConditions',
      data: {
        conditionIds: Object.keys(weights),
        environment,
      },
    }))
  }, [ socket, environment ])

  const unsubscribeCall = useCallback((conditionIds: string[]) => {
    if (socket?.readyState !== 1) {
      return
    }

    socket.send(JSON.stringify({
      event: 'UnsubscribeConditions',
      data: {
        conditionIds,
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

    Object.keys(weights).forEach((conditionId) => {
      if (subscribers.current[conditionId]) {
        subscribers.current[conditionId] += weights[conditionId]!

        if (subscribers.current[conditionId] === 0) {
          delete subscribers.current[conditionId]
          newUnsubscribers.push(conditionId)
        }
      }
    })

    if (!newUnsubscribers.length) {
      return
    }

    unsubscribeCall(newUnsubscribers)
  }, [ socket, unsubscribeCall ])

  const runAction = useCallback(createQueueAction(subscribe, unsubscribe), [ subscribe, unsubscribe ])

  const subscribeToUpdates = useCallback((conditionIds: string[]) => {
    runAction('subscribe', conditionIds)
  }, [ runAction ])

  const unsubscribeToUpdates = useCallback((conditionIds: string[]) => {
    runAction('unsubscribe', conditionIds)
  }, [ runAction ])

  useEffect(() => {
    if (!isSocketReady || !socket) {
      return
    }

    const handleMessage = (message: MessageEvent<string>) => {
      const { event, data }: SocketData = JSON.parse(message.data)

      if (event !== CONDITION_UPDATED_EVENT) {
        return
      }

      const { id: conditionId, outcomes, state } = data

      if (outcomes.length) {
        const eventData: OddsChangedData = {
          conditionId: conditionId,
          // reinforcement: +reinforcement,
          // margin: +margin,
          // winningOutcomesCount: +winningOutcomesCount,
          outcomes: {},
        }

        eventData.outcomes = data.outcomes.reduce((acc, { outcomeId, currentOdds }) => {
          acc[String(outcomeId)] = {
            odds: +currentOdds,
            // clearOdds,
            // maxBet: maxStake,
          }

          return acc
        }, {} as OddsChangedData['outcomes'])

        oddsWatcher.dispatch(conditionId, eventData)
      }

      if (state) {
        conditionStatusWatcher.dispatch(conditionId, state)
      }
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

  const value: ConditionUpdatesContextValue = {
    isSocketReady,
    subscribeToUpdates,
    unsubscribeToUpdates,
  }

  return (
    <ConditionUpdatesContext.Provider value={value}>
      {children}
    </ConditionUpdatesContext.Provider>
  )
}
