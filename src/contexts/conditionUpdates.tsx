import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { type ConditionState } from '@azuro-org/toolkit'

import { createQueueAction } from '../helpers/createQueueAction'
import { conditionWatcher } from '../modules/conditionWatcher'
import { outcomeWatcher } from '../modules/outcomeWatcher'
import { useChain } from './chain'
import { useFeedSocket } from './feedSocket'


export type ConditionUpdatesContextValue = {
  isSocketReady: boolean
  subscribeToUpdates: (conditionIds: string[]) => void
  unsubscribeToUpdates: (conditionIds: string[]) => void
}

enum Event {
  Subscribe = 'SubscribeConditions',
  Unsubscribe = 'UnsubscribeConditions',
  Update = 'ConditionUpdated',
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

export type ConditionUpdatedData = {
  conditionId: string
  state: ConditionState,
  // margin: number
  // reinforcement: number
  // winningOutcomesCount: number
}

export type OutcomeUpdateData = {
  odds: number
  // clearOdds: number
  // maxBet: number
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
      event: Event.Subscribe,
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
      event: Event.Unsubscribe,
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

      if (event !== Event.Update) {
        return
      }

      const { id: conditionId, outcomes, state } = data

      const eventData: ConditionUpdatedData = {
        conditionId: conditionId,
        state,
        // reinforcement: +reinforcement,
        // margin: +margin,
        // winningOutcomesCount: +winningOutcomesCount,
        // outcomes: outcomes.reduce((acc, { outcomeId, currentOdds }) => {
        //   acc[String(outcomeId)] = {
        //     odds: +currentOdds,
        //     // clearOdds,
        //     // maxBet: maxStake,
        //   }

        //   return acc
        // }, {} as ConditionUpdatedData['outcomes']),
      }

      conditionWatcher.dispatch(conditionId, eventData)

      outcomes.forEach(({ outcomeId, currentOdds }) => {
        outcomeWatcher.dispatch(`${conditionId}-${outcomeId}`, {
          odds: +currentOdds,
        })
      })
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
