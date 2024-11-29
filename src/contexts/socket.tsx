import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { chainsData, type ConditionStatus } from '@azuro-org/toolkit'

import { createQueueAction } from '../helpers/createQueueAction'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { oddsWatcher } from '../modules/oddsWatcher'
import { useChain } from './chain'


enum SocketCloseReason {
  ChainChanged = 3000
}

export type SocketContextValue = {
  isSocketReady: boolean
  subscribeToUpdates: (conditionIds: string[]) => void
  unsubscribeToUpdates: (conditionIds: string[]) => void
}

export type SocketData = {
  id: string
  state?: ConditionStatus
  margin: number
  reinforcement: number
  winningOutcomesCount: number
  outcomes?: Array<{
    id: number
    odds: number
    clearOdds: number
    maxStake: number
  }>
}[]

export type OddsChangedData = {
  conditionId: string
  margin: number
  reinforcement: number
  winningOutcomesCount: number
  outcomes: Record<string, {
    odds: number
    clearOdds: number
    maxBet: number
  }>
}

const SocketContext = createContext<SocketContextValue | null>(null)

export const useSocket = () => {
  return useContext(SocketContext) as SocketContextValue
}

export const SocketProvider: React.FC<any> = ({ children }) => {
  const { appChain } = useChain()
  const [ isSocketReady, setSocketReady ] = useState(false)

  const prevChainId = useRef(appChain.id)
  const socket = useRef<WebSocket>()
  const subscribers = useRef<Record<string, number>>({})

  const subscribe = useCallback((weights: Record<string, number>) => {
    if (socket.current?.readyState !== 1) {
      return
    }

    Object.keys(weights).forEach((conditionId) => {
      if (typeof subscribers.current[conditionId] === 'undefined') {
        subscribers.current[conditionId] = 0
      }

      subscribers.current[conditionId] += weights[conditionId]!
    })

    socket.current!.send(JSON.stringify({
      action: 'subscribe',
      conditionIds: Object.keys(weights),
    }))
  }, [])

  const unsubscribeCall = (conditionIds: string[]) => {
    if (socket.current?.readyState !== 1) {
      return
    }

    socket.current!.send(JSON.stringify({
      action: 'unsubscribe',
      conditionIds,
    }))
  }

  const unsubscribe = useCallback((weights: Record<string, number>) => {
    if (socket.current?.readyState !== 1) {
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
  }, [])

  const runAction = useCallback(createQueueAction(subscribe, unsubscribe), [])

  const subscribeToUpdates = useCallback((conditionIds: string[]) => {
    runAction('subscribe', conditionIds)
  }, [])

  const unsubscribeToUpdates = useCallback((conditionIds: string[]) => {
    runAction('unsubscribe', conditionIds)
  }, [])

  const connect = () => {
    socket.current = new WebSocket(chainsData[appChain.id].socket)

    socket.current.onopen = () => {
      setSocketReady(true)
    }

    socket.current.onclose = (event) => {
      subscribers.current = {}
      socket.current = undefined
      setSocketReady(false)

      if (event.code === SocketCloseReason.ChainChanged) {
        return
      }

      connect()
    }

    socket.current.onmessage = (message: MessageEvent<SocketData>) => {
      JSON.parse(message.data.toString()).forEach((data: SocketData[0]) => {
        const { id: conditionId, reinforcement, margin, winningOutcomesCount } = data

        if (data.outcomes) {
          const eventData: OddsChangedData = {
            conditionId: conditionId,
            reinforcement: +reinforcement,
            margin: +margin,
            winningOutcomesCount: +winningOutcomesCount,
            outcomes: {},
          }

          eventData.outcomes = data.outcomes.reduce((acc, { id, odds, clearOdds, maxStake }) => {
            acc[id] = {
              odds,
              clearOdds,
              maxBet: maxStake,
            }

            return acc
          }, {} as Record<number, OddsChangedData['outcomes'][0]>)

          oddsWatcher.dispatch(conditionId, eventData)
        }

        if (data.state) {
          conditionStatusWatcher.dispatch(conditionId, data.state)
        }
      })
    }

    socket.current.onerror = () => {
      subscribers.current = {}
      socket.current = undefined
      setSocketReady(false)

      setTimeout(connect, 1000)
    }
  }

  useEffect(() => {
    if (
      isSocketReady
      && socket.current
      && prevChainId.current !== appChain.id
      && chainsData[prevChainId.current].socket !== chainsData[appChain.id].socket
    ) {
      unsubscribeCall(Object.keys(subscribers.current))
      socket.current.close(SocketCloseReason.ChainChanged)
    }
    prevChainId.current = appChain.id
  }, [ chainsData[appChain.id].socket, isSocketReady ])

  useEffect(() => {
    if (typeof socket.current !== 'undefined' || isSocketReady) {
      return
    }

    connect()
  }, [ chainsData[appChain.id].socket, isSocketReady ])

  const value: SocketContextValue = {
    isSocketReady,
    subscribeToUpdates,
    unsubscribeToUpdates,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
