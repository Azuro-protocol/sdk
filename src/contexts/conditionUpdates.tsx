import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { type ConditionState, type OutcomeState } from '@azuro-org/toolkit'

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
  Subscribed = 'SubscribedToConditions',
  Update = 'ConditionUpdated',
}

export type ConditionOutcomeData = {
  /** a number here, a string in the REST feed */
  outcomeId: number
  title: string | null
  currentOdds: string
  turnover: string
  potentialLoss: string
  state: OutcomeState
  hidden: boolean
}

export type ConditionData = {
  // conditionId
  id: string
  gameId: string
  maxConditionPotentialLoss: string
  maxOutcomePotentialLoss: string
  currentConditionPotentialLoss: string
  isPrematchEnabled: boolean
  isLiveEnabled: boolean
  isCashoutEnabled: boolean
  state: ConditionState
  /** whether the feed is offering this condition right now */
  hidden: boolean
  outcomes: ConditionOutcomeData[]
}

export type ConditionUpdatedMessage = {
  id: string
  event: Event.Update
  data: ConditionData
}

/**
 * Ack for a `SubscribeConditions` call - the server echoes the ids back without validating them.
 * Nothing reads it; it is typed so it can't be taken for a condition update.
 * */
export type SubscribedToConditionsMessage = {
  id: string
  event: Event.Subscribed
  data: {
    conditionIds: string[]
  }
}

export type SocketData = ConditionUpdatedMessage | SubscribedToConditionsMessage

export type ConditionUpdatedData = {
  conditionId: string
  state: ConditionState
  /** whether the feed is offering this condition right now */
  hidden: boolean
  gameId: string
  isLiveEnabled: boolean
  isPrematchEnabled: boolean
  isCashoutEnabled: boolean
  outcomes: ConditionOutcomeData[]
}

export type OutcomeUpdateData = {
  odds: number
  turnover: string
  state: OutcomeState
  hidden: boolean
  /**
   * State of the condition in the message this update was carried by.
   *
   * `odds` and `turnover` are reported for real in every message, but `state` and `hidden` are only
   * meaningful when this is `ConditionState.Active`: an update for an inactive condition reports
   * every one of its outcomes as `Stopped`, whatever they had actually settled to.
   * */
  conditionState: ConditionState
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
        conditionIds: newSubscribers,
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
    const filtered = conditionIds.filter(Boolean)

    if (!filtered.length) {
      return
    }

    runAction('subscribe', filtered)
  }, [ runAction ])

  const unsubscribeToUpdates = useCallback((conditionIds: string[]) => {
    const filtered = conditionIds.filter(Boolean)

    if (!filtered.length) {
      return
    }

    runAction('unsubscribe', filtered)
  }, [ runAction ])

  useEffect(() => {
    if (!isSocketReady || !socket) {
      return
    }

    const handleMessage = (message: MessageEvent<string>) => {
      const socketData: SocketData = JSON.parse(message.data)

      if (socketData.event !== Event.Update) {
        return
      }

      const {
        id: conditionId, outcomes, state, hidden, isLiveEnabled, isPrematchEnabled, isCashoutEnabled, gameId,
      } = socketData.data

      const eventData: ConditionUpdatedData = {
        conditionId,
        state,
        hidden,
        gameId,
        isCashoutEnabled,
        isLiveEnabled,
        isPrematchEnabled,
        outcomes,
      }

      conditionWatcher.dispatch(conditionId, eventData)

      outcomes.forEach(({ outcomeId, currentOdds, turnover, state: outcomeState, hidden: outcomeHidden }) => {
        outcomeWatcher.dispatch(`${conditionId}-${outcomeId}`, {
          odds: +currentOdds,
          turnover,
          state: outcomeState,
          hidden: outcomeHidden,
          conditionState: state,
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
