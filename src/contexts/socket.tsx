import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

import { socketApiUrl } from '../config'
import type { ConditionStatus } from '../docs/prematch/types'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { oddsWatcher } from '../modules/oddsWatcher'


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
  const socket = useRef<WebSocket>()
  const [ isSocketReady, setSocketReady ] = useState(false)
  const subscribers = useRef<Record<string, number>>({})

  const subscribeToUpdates = (conditionIds: string[]) => {
    if (!isSocketReady) {
      throw Error('socket isn\'t ready')
    }

    conditionIds.forEach((conditionId) => {
      if (typeof subscribers.current[conditionId] === 'undefined') {
        subscribers.current[conditionId] = 0
      }

      subscribers.current[conditionId] += 1
    })

    socket.current!.send(JSON.stringify({
      action: 'subscribe',
      conditionIds,
    }))
  }

  const unsubscribeToUpdates = (conditionIds: string[]) => {
    if (!isSocketReady) {
      throw Error('socket isn\'t ready')
    }

    // we mustn't unsubscribe for condition if it has more that 1 subscriber
    const newUnsubscribers: string[] = []

    conditionIds.forEach((conditionId) => {
      if (subscribers.current[conditionId]! > 1) {
        subscribers.current[conditionId] -= 1
      }
      else {
        subscribers.current[conditionId] = 0
        newUnsubscribers.push(conditionId)
      }
    })

    if (!newUnsubscribers.length) {
      return
    }

    socket.current!.send(JSON.stringify({
      action: 'unsubscribe',
      conditionIds: newUnsubscribers,
    }))
  }

  useEffect(() => {
    if (socket.current) {
      return
    }

    const connect = () => {
      const newSocket = new WebSocket(socketApiUrl)

      newSocket.onopen = () => {
        setSocketReady(true)
        socket.current = newSocket
      }

      newSocket.onmessage = (message: MessageEvent<SocketData>) => {
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

      newSocket.onclose = () => {
        socket.current = undefined
        setSocketReady(false)

        setTimeout(connect, 1000)
      }

      newSocket.onerror = () => {
        newSocket.close()
      }
    }

    connect()

    return () => {
      if (socket.current) {
        socket.current.close()
      }
    }
  }, [])

  const value = {
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
