import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { chainsData } from '@azuro-org/toolkit'

import { createQueueAction } from '../helpers/createQueueAction'
import { liveStatisticWatcher } from '../modules/liveStatisticWatcher'
import { useChain } from './chain'


enum SocketCloseReason {
  ChainChanged = 3000
}

export type LiveStatisticsSocket = {
  isSocketReady: boolean
  subscribeToUpdates: (gameIds: string[]) => void
  unsubscribeToUpdates: (gameIds: string[]) => void
}

enum Status {
  InProgress = 'In progress',
  NotStarted = 'Not started yet',
  Finished = 'Finished',
  PreFinished = 'PreFinished',
  CoverageLost = 'Coverage lost',
  Suspended = 'Suspended'
}

export type HomeGuest<T> = {
  h: T
  g: T
}

export type SoccerScoreBoard = {
  time: string
  freeKicks: HomeGuest<number>
  goalKicks: HomeGuest<number>
  goals: HomeGuest<number>
  corners: HomeGuest<number>
  penalties: HomeGuest<number>
  reds: HomeGuest<number>
  yellows: HomeGuest<number>
  throwIns: HomeGuest<number>
  half: HomeGuest<number>
  half2: HomeGuest<number>
  half_extra_time: HomeGuest<number>
  half2_extra_time: HomeGuest<number>
  substitutions: HomeGuest<number>
  offsides: HomeGuest<number>
  shotsOffTarget: HomeGuest<number>
  shotsOnTarget: HomeGuest<number>
  fouls: HomeGuest<number>
  penalty_period: {
    score: HomeGuest<boolean[]>
    penalties: HomeGuest<boolean[]>
  }
  state: string
}

export type BasketballScoreBoard = {
  time: string
  half: HomeGuest<number>
  q1: HomeGuest<number>
  q2: HomeGuest<number>
  q3: HomeGuest<number>
  q4: HomeGuest<number>
  total: HomeGuest<number>
  overtime: HomeGuest<number>
  possession: HomeGuest<boolean>
  state: string
}

export type TennisScoreBoard = {
  points: HomeGuest<number>
  s1: HomeGuest<number>
  s2: HomeGuest<number>
  s3: HomeGuest<number>
  s4: HomeGuest<number>
  s5: HomeGuest<number>
  servis: HomeGuest<boolean>
  sets: HomeGuest<number>
  state: string
}

export type VolleyballScoreBoard = {
  s1: HomeGuest<number>
  s2: HomeGuest<number>
  s3: HomeGuest<number>
  s4: HomeGuest<number>
  s5: HomeGuest<number>
  servis: HomeGuest<boolean>
  sets: HomeGuest<number>
  state: string
}

export type ScoreBoard = SoccerScoreBoard | BasketballScoreBoard | TennisScoreBoard | VolleyballScoreBoard

export type SoccerStats = {
  attacks: HomeGuest<number>
  dangerousAttacks: HomeGuest<number>
  goals: HomeGuest<number>
  possession: HomeGuest<number>
  penalties: HomeGuest<number>
  corners: HomeGuest<number>
  yellowCards: HomeGuest<number>
  redCards: HomeGuest<number>
  totalShots: HomeGuest<number>
  shotsOnTarget: HomeGuest<number>
  shotsOffTarget: HomeGuest<number>
  throwIns: HomeGuest<number>
  freeKicks: HomeGuest<number>
  goalKicks: HomeGuest<number>
  substitutions: HomeGuest<number>
  actionArea: HomeGuest<number>
  expectedGoals: HomeGuest<number>
  passes: HomeGuest<number>
  goalkeeperSaves: HomeGuest<number>
  passingAccuracy: HomeGuest<number>
  crosses: HomeGuest<number>
  offsides: HomeGuest<number>
  ballSafe: HomeGuest<number>
  shotsBlocked: HomeGuest<number>
  injuryBreaks: HomeGuest<number>
  missedPenalties: HomeGuest<number>
  kickoffs: HomeGuest<number>
}

export type BasketballStats = {
  fouls: HomeGuest<number>
  freeThrows: HomeGuest<number>
  freeThrowsScoredPerc: HomeGuest<number>
  twoPointers: HomeGuest<number>
  threePointers: HomeGuest<number>
  timeoutsTaken: HomeGuest<number>
  timeoutsRemaining: HomeGuest<number>
  jumpBalls: HomeGuest<number>
  assists: HomeGuest<number>
  offensiveRebounds: HomeGuest<number>
  defensiveRebounds: HomeGuest<number>
  totalRebounds: HomeGuest<number>
  turnovers: HomeGuest<number>
  steals: HomeGuest<number>
  blocks: HomeGuest<number>
  playersDisqualified: HomeGuest<number>
}

export type TennisStats = {
  serviceFaults: HomeGuest<number>
  doubleFaults: HomeGuest<number>
  aces: HomeGuest<number>
  breakPoints: HomeGuest<number>
  breakPointsConversion: HomeGuest<number>
  winFirstServePerc: HomeGuest<number>
  winSecondServePerc: HomeGuest<number>
  pointsOnOwnServe: HomeGuest<number>
  totalPointsWon: HomeGuest<number>
}

export type VolleyballStats = {
  longestStreak: HomeGuest<number>
  pointsWonOnOwnServe: HomeGuest<number>
  pointsWonOnOpponentServe: HomeGuest<number>
  aces: HomeGuest<number>
  serviceErrors: HomeGuest<number>
}

export type Stats = SoccerStats | BasketballStats | TennisStats | VolleyballStats

export type SoccerStatistic = {
  scoreBoard: SoccerScoreBoard | null
  stats: SoccerStats | null
}
export type BasketballStatistic = {
  scoreBoard: BasketballScoreBoard | null
  stats: BasketballStats | null
}
export type TennisStatistic = {
  scoreBoard: TennisScoreBoard | null
  stats: TennisStats | null
}
export type VolleyballStatistic = {
  scoreBoard: VolleyballScoreBoard | null
  stats: VolleyballStats | null
}

type LiveStatisticSocketData = {
  id: string
  fixture: {
    status: Status,
  } | null
  live: {
    scoreBoard: ScoreBoard | null
    stats: Stats | null
  } | null
}[]

export type LiveStatistics = {
  status: Status | null
  scoreBoard: ScoreBoard | null
  stats: Stats | null
}

const LiveStatisticsSocketContext = createContext<LiveStatisticsSocket | null>(null)

export const useLiveStatisticsSocket = () => {
  return useContext(LiveStatisticsSocketContext) as LiveStatisticsSocket
}

export const LiveStatisticsSocketProvider: React.FC<any> = ({ children }) => {
  const { appChain } = useChain()
  const [ isSocketReady, setSocketReady ] = useState(false)

  const prevChainId = useRef(appChain.id)
  const socket = useRef<WebSocket>()
  const subscribers = useRef<Record<string, number>>({})

  const subscribe = useCallback((weights: Record<string, number>) => {
    if (socket.current?.readyState !== 1) {
      return
    }

    Object.keys(weights).forEach((gameId) => {
      if (typeof subscribers.current[gameId] === 'undefined') {
        subscribers.current[gameId] = 0
      }

      subscribers.current[gameId] += weights[gameId]!
    })

    socket.current!.send(JSON.stringify({
      action: 'subscribe',
      gameIds: Object.keys(weights),
    }))
  }, [])

  const unsubscribeCall = (gameIds: string[]) => {
    if (socket.current?.readyState !== 1) {
      return
    }

    socket.current!.send(JSON.stringify({
      action: 'unsubscribe',
      gameIds,
    }))
  }

  const unsubscribe = useCallback((weights: Record<string, number>) => {
    if (socket.current?.readyState !== 1) {
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
  }, [])

  const runAction = useCallback(createQueueAction(subscribe, unsubscribe), [])

  const subscribeToUpdates = useCallback((gameIds: string[]) => {
    runAction('subscribe', gameIds)
  }, [])

  const unsubscribeToUpdates = useCallback((gameIds: string[]) => {
    runAction('unsubscribe', gameIds)
  }, [])

  const connect = () => {
    socket.current = new WebSocket('wss://dev-streams.azuro.org/v1/streams/statistics/games') // TODO
    // socket.current = new WebSocket(`${chainsData[appChain.id].socket}/statistics/games`)

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

    socket.current.onmessage = (message: MessageEvent<LiveStatisticSocketData>) => {
      JSON.parse(message.data.toString()).forEach((data: LiveStatisticSocketData[0]) => {
        const { id, fixture, live } = data

        let statsData: LiveStatistics = {
          status: fixture?.status || null,
          scoreBoard: live?.scoreBoard || null,
          stats: live?.stats || null,
        }

        liveStatisticWatcher.dispatch(id, statsData)
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

  const value: LiveStatisticsSocket = {
    isSocketReady,
    subscribeToUpdates,
    unsubscribeToUpdates,
  }

  return (
    <LiveStatisticsSocketContext.Provider value={value}>
      {children}
    </LiveStatisticsSocketContext.Provider>
  )
}
