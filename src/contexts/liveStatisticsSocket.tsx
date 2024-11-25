import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { chainsData } from '@azuro-org/toolkit'

import { debounce } from '../helpers/debounce'
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

type HomeGuest<T> = {
  h: T
  g: T
}

type SoccerScoreBoard = {
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

type BasketballScoreBoard = {
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

type TennisScoreBoard = {
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

type VolleyballScoreBoard = {
  s1: HomeGuest<number>
  s2: HomeGuest<number>
  s3: HomeGuest<number>
  s4: HomeGuest<number>
  s5: HomeGuest<number>
  servis: HomeGuest<boolean>
  sets: HomeGuest<number>
  state: string
}

type CricketScoreBoard = {
  cur_inning: number
  over: number
  delivery: number
  i1: HomeGuest<string>
  i2: HomeGuest<string>
  runs: HomeGuest<number>
  possession: HomeGuest<boolean>
  state: string
}

type ScoreBoard = SoccerScoreBoard | BasketballScoreBoard | TennisScoreBoard | VolleyballScoreBoard | null

type SoccerStats = {
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

type BasketballStats = {
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

type TennisStats = {
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

type VolleyballStats = {
  longestStreak: HomeGuest<number>
  pointsWonOnOwnServe: HomeGuest<number>
  pointsWonOnOpponentServe: HomeGuest<number>
  aces: HomeGuest<number>
  serviceErrors: HomeGuest<number>
}

type Stats = SoccerStats | BasketballStats | TennisStats | VolleyballStats | null

export type SoccerStatistic = SoccerScoreBoard & SoccerStats
export type BasketballStatistic = BasketballScoreBoard & BasketballStats
export type TennisStatistic = TennisScoreBoard & TennisStats
export type VolleyballStatistic = VolleyballScoreBoard & VolleyballStats

export type LiveStatisticSocketData = {
  id: string
  fixture: {
    status: Status,
  }
  live: {
    scoreBoard: ScoreBoard | null
    stats: Stats | null
  }
}[]

export type LiveStatisticsData = {
  status: Status
  stats: SoccerStatistic | BasketballStatistic | TennisStatistic | VolleyballStatistic
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

  const subscribe = useCallback((gameIds: string[]) => {
    if (socket.current?.readyState !== 1) {
      return
    }

    gameIds.forEach((gameId) => {
      if (typeof subscribers.current[gameId] === 'undefined') {
        subscribers.current[gameId] = 0
      }

      subscribers.current[gameId] += 1
    })

    socket.current!.send(JSON.stringify({
      action: 'subscribe',
      gameIds,
    }))
  }, [])

  const unsubscribe = useCallback((gameIds: string[]) => {
    if (socket.current?.readyState !== 1) {
      return
    }

    // we mustn't unsubscribe for condition if it has more that 1 subscriber
    const newUnsubscribers: string[] = []

    gameIds.forEach((gameId) => {
      if (subscribers.current[gameId]) {
        if (subscribers.current[gameId]! > 1) {
          subscribers.current[gameId] -= 1
        }
        else {
          subscribers.current[gameId] = 0
          newUnsubscribers.push(gameId)
        }
      }
    })

    if (!newUnsubscribers.length) {
      return
    }

    socket.current!.send(JSON.stringify({
      action: 'unsubscribe',
      gameIds: newUnsubscribers,
    }))
  }, [])

  const actionList = () => {
    const actions = {
      subscribe: [] as string[],
      unsubscribe: [] as string[],
    }

    const run = (action: 'subscribe' | 'unsubscribe', gameIds: string[]) => {
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
      gameIds.forEach(id => {
        actions[action].push(id)
      })
    }

    return run
  }

  const runAction = actionList()

  const subscribeToUpdates = useCallback((gameIds: string[]) => {
    runAction('subscribe', gameIds)
  }, [])

  const unsubscribeToUpdates = useCallback((gameIds: string[]) => {
    runAction('unsubscribe', gameIds)
  }, [])

  const connect = () => {
    socket.current = new WebSocket(`${chainsData[appChain.id].socket}/statistics/games`)

    socket.current.onopen = () => {
      setSocketReady(true)
    }

    socket.current.onclose = (event) => {
      if (event.code === SocketCloseReason.ChainChanged) {
        return
      }

      socket.current = undefined
      setSocketReady(false)
      connect()
    }

    socket.current.onmessage = (message: MessageEvent<LiveStatisticSocketData>) => {
      JSON.parse(message.data.toString()).forEach((data: LiveStatisticSocketData[0]) => {
        const { id, fixture: { status }, live: { scoreBoard, stats } } = data

        if (scoreBoard || stats) {
          liveStatisticWatcher.dispatch(id, {
            status,
            stats: {
              ...(stats || {}),
              ...(scoreBoard || {}),
            } as LiveStatisticsData['stats'],
          })
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
      socket.current = undefined
      setSocketReady(false)
    }
    prevChainId.current = appChain.id
  }, [ appChain, isSocketReady ])

  useEffect(() => {
    if (typeof socket.current !== 'undefined') {
      return
    }

    connect()
  }, [ appChain ])

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
