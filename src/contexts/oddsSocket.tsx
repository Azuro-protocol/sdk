import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { chainsData, type ConditionStatus } from '@azuro-org/toolkit'

import { debounce } from '../helpers/debounce'
import { conditionStatusWatcher } from '../modules/conditionStatusWatcher'
import { oddsWatcher } from '../modules/oddsWatcher'
import { useChain } from './chain'


enum SocketCloseReason {
  ChainChanged = 3000
}

export type OddsSocketContextValue = {
  isSocketReady: boolean
  subscribeToUpdates: (conditionIds: string[]) => void
  unsubscribeToUpdates: (conditionIds: string[]) => void
}

export type OddsSocketData = {
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

const OddsSocketContext = createContext<OddsSocketContextValue | null>(null)

export const useOddsSocket = () => {
  return useContext(OddsSocketContext) as OddsSocketContextValue
}

export const OddsSocketProvider: React.FC<any> = ({ children }) => {
  const { appChain } = useChain()
  const [ isSocketReady, setSocketReady ] = useState(false)

  const prevChainId = useRef(appChain.id)
  const socket = useRef<WebSocket>()
  const subscribers = useRef<Record<string, number>>({})

  const subscribe = useCallback((conditionIds: string[]) => {
    if (socket.current?.readyState !== 1) {
      return
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
  }, [])

  const unsubscribe = useCallback((conditionIds: string[]) => {
    if (socket.current?.readyState !== 1) {
      return
    }

    // we mustn't unsubscribe for condition if it has more that 1 subscriber
    const newUnsubscribers: string[] = []

    conditionIds.forEach((conditionId) => {
      if (subscribers.current[conditionId]) {
        if (subscribers.current[conditionId]! > 1) {
          subscribers.current[conditionId] -= 1
        }
        else {
          subscribers.current[conditionId] = 0
          newUnsubscribers.push(conditionId)
        }
      }
    })

    if (!newUnsubscribers.length) {
      return
    }

    socket.current!.send(JSON.stringify({
      action: 'unsubscribe',
      conditionIds: newUnsubscribers,
    }))
  }, [])

  const actionList = () => {
    const actions = {
      subscribe: [] as string[],
      unsubscribe: [] as string[],
    }

    const run = (action: 'subscribe' | 'unsubscribe', conditionIds: string[]) => {
      // group batch requests
      const request = debounce(() => {
        const subscribeQueue = [ ...actions.subscribe ]
        const unsubscribeQueue = [ ...actions.unsubscribe ]

        actions.subscribe = []
        actions.unsubscribe = []

        const weights: Record<string, number> = {}

        subscribeQueue.forEach(id => {
          if (!weights[id]) {
            weights[id] = 1
          }
          else {
            weights[id]++
          }
        })

        unsubscribeQueue.forEach(id => {
          if (!weights[id]) {
            weights[id] = -1
          }
          else {
            weights[id]--
          }
        })

        const { shouldSubscribe, shouldUnsubscribe } = Object.keys(weights).reduce((acc, id) => {
          if (weights[id]! > 0) {
            acc.shouldSubscribe.push(id)
          }
          else if (weights[id]! < 0) {
            acc.shouldUnsubscribe.push(id)
          }

          return acc
        }, {
          shouldSubscribe: [] as string[],
          shouldUnsubscribe: [] as string[],
        })

        if (shouldSubscribe.length) {
          subscribe(shouldSubscribe)
        }

        if (shouldUnsubscribe.length) {
          unsubscribe(shouldUnsubscribe)
        }
      }, 50)

      request()
      conditionIds.forEach(id => {
        actions[action].push(id)
      })
    }

    return run
  }

  const runAction = actionList()

  const subscribeToUpdates = useCallback((conditionIds: string[]) => {
    runAction('subscribe', conditionIds)
  }, [])

  const unsubscribeToUpdates = useCallback((conditionIds: string[]) => {
    runAction('unsubscribe', conditionIds)
  }, [])

  const connect = () => {
    socket.current = new WebSocket(`${chainsData[appChain.id].socket}/conditions`)

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

    socket.current.onmessage = (message: MessageEvent<OddsSocketData>) => {
      JSON.parse(message.data.toString()).forEach((data: OddsSocketData[0]) => {
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
      unsubscribe(Object.keys(subscribers.current))
      socket.current.close(SocketCloseReason.ChainChanged)
    }
    prevChainId.current = appChain.id
  }, [ appChain, isSocketReady ])

  useEffect(() => {
    if (typeof socket.current !== 'undefined') {
      return
    }

    connect()
  }, [ appChain ])

  const value: OddsSocketContextValue = {
    isSocketReady,
    subscribeToUpdates,
    unsubscribeToUpdates,
  }

  return (
    <OddsSocketContext.Provider value={value}>
      {children}
    </OddsSocketContext.Provider>
  )
}
