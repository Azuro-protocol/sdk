import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { chainsData } from '@azuro-org/toolkit'

import { createQueueAction } from '../helpers/createQueueAction'
import { liveStatisticWatcher } from '../modules/liveStatisticWatcher'
import { useChain } from './chain'


enum SocketCloseReason {
  Unmount = 3000
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

export enum SoccerIncidentType {
  Goal = 'goal',
  Corner = 'corner',
  YellowCard = 'yellow_card',
  RedCard = 'red_card',
  Substitution = 'substitution',
  GoalKick = 'goal_kick',
  TrownIn = 'throw_in',
  Penalty = 'penalty',
  Offside = 'offside',
  ScoreAfterFirstHalf = 'score_after_first_half',
  ScoreAfterFullTime = 'score_after_full_time',
  ScoreAfterExtraTime = 'score_after_extra_time',
  ScoreAfterExtraTimeHalfTime = 'score_after_extra_time_half_time',
  ScoreAfterPenalties = 'score_after_penalties',
  ExtraTimeStart = 'extra_time_start',
  PenaltiesStart = 'penalties_start',
  PenaltyShootOut = 'penalty_shoot_out',
  MissPenalty = 'miss_penalty',
}

export type SoccerIncidentGoal = {
  type: SoccerIncidentType.Goal
  goal: number
  participant: number
  method: string
  minute: number
  source: string
  description: string
}

export type SoccerIncidenCorner = {
  type: SoccerIncidentType.Corner
  corner: number
  participant: number
  minute: number
  source: string
  description: string
}

export type SoccerIncidentCard = {
  type: SoccerIncidentType.YellowCard | SoccerIncidentType.RedCard
  card: number
  participant: number
  minute: number
  source: string
  description: string
}

export type SoccerIncidentSubstitution = {
  type: SoccerIncidentType.Substitution
  player_in: string
  player_out: string
  participant: number
  minute: number
  source: string
  description: string
}

export type SoccerIncidentGoalKick = {
  type: SoccerIncidentType.GoalKick
  minute: number
  source: string
  description: string
}

export type SoccerIncidentThrowIn = {
  type: SoccerIncidentType.TrownIn
  minute: number
  source: string
  description: string
}

export type SoccerIncidentPenalty = {
  type: SoccerIncidentType.Penalty
  participant: number
  minute: number
  source: string
  description: string
}

export type SoccerIncidentOffside = {
  type: SoccerIncidentType.Offside
  participant: number
  minute: number
  source: string
  description: string
}

export type SoccerIncidentScore = {
  type: SoccerIncidentType.ScoreAfterFirstHalf | SoccerIncidentType.ScoreAfterFullTime | SoccerIncidentType.ScoreAfterExtraTime | SoccerIncidentType.ScoreAfterExtraTimeHalfTime | SoccerIncidentType.ScoreAfterPenalties
  participant1_points: number
  participant2_points: number
  score: string
  winner: number
  minute: number
  source: string
  description: string
}

export type SoccerIncidentExtraTimeStart = {
  type: SoccerIncidentType.ExtraTimeStart
  minute: number
  source: string
  description: string
}

export type SoccerIncidentPenaltiesStart = {
  type: SoccerIncidentType.PenaltiesStart
  minute: number
  source: string
  description: string
}

export type SoccerIncidentPenaltyShootOut = {
  type: SoccerIncidentType.PenaltyShootOut
  minute: number
  source: string
  description: string
}

export type SoccerIncidentMissPenalty = {
  type: SoccerIncidentType.MissPenalty
  minute: number
  source: string
  description: string
}

export type SoccerIncidens = Array<SoccerIncidentGoal | SoccerIncidenCorner | SoccerIncidentCard | SoccerIncidentSubstitution | SoccerIncidentGoalKick | SoccerIncidentThrowIn | SoccerIncidentPenalty | SoccerIncidentOffside | SoccerIncidentScore | SoccerIncidentExtraTimeStart | SoccerIncidentPenaltiesStart | SoccerIncidentPenaltyShootOut | SoccerIncidentMissPenalty>

export enum BasketballIncidentType {
  MatchStart = 'match_start',
  MatchEnd = 'match_end',
  QuarterStart = 'quarter_start',
  QuarterEnd = 'quarter_end',
  Point = 'point',
  FreeThrow = 'free_throw',
  MissedThrow = 'missed_throw',
  MissedFreeThrow = 'missed_free_throw',
  PlayersOnCort = 'players_on_cort',
  PlayersWarmingUp = 'players_warming_up',
  Foul = 'foul',
  Rebound = 'rebound',
  Timeout = 'timeout',
  TimeoutStart = 'timeout_start',
  TimeoutEnd = 'timeout_end',
  Turnover = 'turnover',
  Block = 'block',
  Steal = 'steal',
  Halftime = 'halftime',
  Fulltime = 'fulltime',
  Overtime = 'overtime',
  OvertimeStart = 'overtime_start',
  OvertimeEnd = 'overtime_end',
}

export type BasketballIncidentMatchStart = {
  type: BasketballIncidentType.MatchStart
  id: number
  description: string
  source: string
}

export type BasketballIncidentMatchEnd = {
  type: BasketballIncidentType.MatchEnd
  id: number
  description: string
  source: string
  score: HomeGuest<number>
}

export type BasketballIncidentQuarterStart = {
  type: BasketballIncidentType.QuarterStart
  id: number
  description: string
  source: string
  quarter: number
}

export type BasketballIncidentQuarterEnd = {
  type: BasketballIncidentType.QuarterEnd
  id: number
  description: string
  quarter: number
  source: string
  score: HomeGuest<number>
}

export type BasketballIncidentPoint = {
  type: BasketballIncidentType.Point
  id: number
  description: string
  points: number
  source: string
  score: HomeGuest<number>
  participant: number
  time: string
  quarter: number
}

export type BasketballIncidentFreeThrow = {
  type: BasketballIncidentType.FreeThrow
  id: number
  description: string
  throws: number
  source: string
  participant: number
  time: string
  quarter: number
}

export type BasketballIncidentMissedThrow = {
  type: BasketballIncidentType.MissedThrow
  id: number
  description: string
  points: number
  source: string
  participant: number
  time: string
  quarter: number
}

export type BasketballIncidentMissedFreeThrow = {
  type: BasketballIncidentType.MissedFreeThrow
  id: number
  description: string
  source: string
  participant: number
  time: string
  quarter: number
}

export type BasketballIncidentPlayersOnCort = {
  type: BasketballIncidentType.PlayersOnCort
  id: number
  description: string
  source: string
}

export type BasketballIncidentPlayersWarmingUp = {
  type: BasketballIncidentType.PlayersWarmingUp
  id: number
  description: string
  source: string
}

export type BasketballIncidentFoul = {
  type: BasketballIncidentType.Foul
  id: number
  description: string
  reason: string
  source: string
  participant: number
  time: string
  quarter: number
}

export type BasketballIncidentRebound = {
  type: BasketballIncidentType.Rebound
  id: number
  description: string
  direction: 'offensive' | 'defensive'
  source: string
  participant: number
  time: string
  quarter: number
}

export type BasketballIncidentTimeout = {
  type: BasketballIncidentType.Timeout
  id: number
  description: string
  source: string
  participant: number
  quarter: number
}

export type BasketballIncidentTimeoutStart = {
  type: BasketballIncidentType.TimeoutStart
  id: number
  description: string
  source: string
  participant: number
  quarter: number
}

export type BasketballIncidentTimeoutEnd = {
  type: BasketballIncidentType.TimeoutEnd
  id: number
  description: string
  source: string
  participant: number
  time: string
  quarter: number
}

export type BasketballIncidentTurnover = {
  type: BasketballIncidentType.Turnover
  id: number
  description: string
  reason: string
  source: string
  participant: number
  quarter: number
}

export type BasketballIncidentBlock = {
  type: BasketballIncidentType.Block
  id: number
  description: string
  source: string
  participant: number
  quarter: number
}

export type BasketballIncidentSteal = {
  type: BasketballIncidentType.Steal
  id: number
  description: string
  source: string
  participant: number
  quarter: number
}

export type BasketballIncidentHalftime = {
  type: BasketballIncidentType.Halftime
  id: number
  description: string
  source: string
  score: HomeGuest<number>
}

export type BasketballIncidentFulltime = {
  type: BasketballIncidentType.Fulltime
  id: number
  description: string
  source: string
  score: HomeGuest<number>
}

export type BasketballIncidentOvertime = {
  type: BasketballIncidentType.Overtime
  id: number
  description: string
  source: string
}

export type BasketballIncidentOvertimeStart = {
  type: BasketballIncidentType.OvertimeStart
  id: number
  description: string
  source: string
}

export type BasketballIncidentOvertimeEnd = {
  type: BasketballIncidentType.OvertimeEnd
  id: number
  description: string
  source: string
  score: HomeGuest<number>
}

export type BasketballIncidens = Array<BasketballIncidentMatchStart | BasketballIncidentMatchEnd | BasketballIncidentQuarterStart | BasketballIncidentQuarterEnd | BasketballIncidentPoint | BasketballIncidentFreeThrow | BasketballIncidentMissedThrow | BasketballIncidentMissedFreeThrow | BasketballIncidentPlayersOnCort | BasketballIncidentPlayersWarmingUp | BasketballIncidentFoul | BasketballIncidentRebound | BasketballIncidentTimeout | BasketballIncidentTimeoutStart | BasketballIncidentTimeoutEnd | BasketballIncidentTurnover | BasketballIncidentBlock | BasketballIncidentSteal | BasketballIncidentHalftime | BasketballIncidentFulltime | BasketballIncidentOvertime | BasketballIncidentOvertimeStart | BasketballIncidentOvertimeEnd>

export enum TennisIncidentType {
  MatchStart = 'match_start',
  MatchEnd = 'match_end',
  SetStart = 'set_start',
  SetEnd = 'set_end',
  PlayersOnCort = 'players_on_cort',
  PlayersWarmingUp = 'players_warming_up',
  FirstServer = 'first_server',
  Service = 'service',
  Point = 'point',
  Game = 'game',
  Set = 'set',
  Fault = 'fault',
}

export type TennisIncidentMatchStart = {
  type: TennisIncidentType.MatchStart
  id: number
  description: string
  source: string
}

export type TennisIncidentMatchEnd = {
  type: TennisIncidentType.MatchEnd
  id: number
  description: string
  source: string
  score: HomeGuest<number>
}

export type TennisIncidentSetStart = {
  type: TennisIncidentType.SetStart
  id: number
  description: string
  source: string
  set: number
}

export type TennisIncidentSetEnd = {
  type: TennisIncidentType.SetEnd
  id: number
  description: string
  source: string
  set: number
  score: HomeGuest<number>
}

export type TennisIncidentPlayersOnCort = {
  type: TennisIncidentType.PlayersOnCort
  id: number
  description: string
  source: string
}

export type TennisIncidentPlayersWarmingUp = {
  type: TennisIncidentType.PlayersWarmingUp
  id: number
  description: string
  source: string
}

export type TennisIncidentFirstServer = {
  type: TennisIncidentType.FirstServer
  id: number
  description: string
  source: string
  participant: number
}

export type TennisIncidentService = {
  type: TennisIncidentType.Service
  id: number
  description: string
  source: string
  participant: number
  set: number
  game: number
}

export type TennisIncidentPoint = {
  type: TennisIncidentType.Point
  id: number
  description: string
  source: string
  score: HomeGuest<number>
  pointType: string
  reason: string
  participant: number
  set: number
  game: number
}

export type TennisIncidentGame = {
  type: TennisIncidentType.Game
  id: number
  description: string
  score: HomeGuest<number>
  source: string
  participant: number
  set: number
  game: number
}

export type TennisIncidentSet = {
  type: TennisIncidentType.Set
  id: number
  description: string
  score: HomeGuest<number>
  source: string
  set: number
  participant: number
}

export type TennisIncidentFault = {
  type: TennisIncidentType.Fault
  id: number
  description: string
  reason: string
  source: string
  set: number
  game: number
  participant: number
}

export type TennisIncidents = Array<TennisIncidentMatchStart | TennisIncidentMatchEnd | TennisIncidentSetStart | TennisIncidentSetEnd | TennisIncidentPlayersOnCort | TennisIncidentPlayersWarmingUp | TennisIncidentFirstServer | TennisIncidentService | TennisIncidentPoint | TennisIncidentGame | TennisIncidentSet | TennisIncidentFault>

export enum VolleyballIncidentType {
  MatchStart = 'match_start',
  MatchEnd = 'match_end',
  SetStart = 'set_start',
  SetEnd = 'set_end',
  FirstServer = 'first_server',
  Rally = 'rally',
  PointWon = 'point_won',
  ServiceError = 'service_error',
  Timeout = 'timeout',
  TimeoutStart = 'timeout_start',
  TimeoutEnd = 'timeout_end',
  Ace = 'ace',
  MatchDelay = 'match_delay',
  PlayersOnCort = 'players_on_cort',
  PlayersWarmingUp = 'players_warming_up',
  Service = 'service',
}

export type VolleyballIncidentMatchStart = {
  type: VolleyballIncidentType.MatchStart
  id: number
  description: string
  source: string
}

export type VolleyballIncidentMatchEnd = {
  type: VolleyballIncidentType.MatchEnd
  id: number
  description: string
  source: string
  score: HomeGuest<number>
}

export type VolleyballIncidentSetStart = {
  type: VolleyballIncidentType.SetStart
  id: number
  description: string
  source: string
  set: number
}

export type VolleyballIncidentSetEnd = {
  type: VolleyballIncidentType.SetEnd
  id: number
  description: string
  source: string
  set: number
  score: HomeGuest<number>
  participant: number
}

export type VolleyballIncidentFirstServer = {
  type: VolleyballIncidentType.FirstServer
  id: number
  description: string
  source: string
  participant: number
  set: number
}

export type VolleyballIncidentRally = {
  type: VolleyballIncidentType.Rally
  id: number
  description: string
  source: string
}

export type VolleyballIncidentPointWon = {
  type: VolleyballIncidentType.PointWon
  id: number
  description: string
  source: string
  set: number
  score: HomeGuest<number>
  participant: number
}

export type VolleyballIncidentServiceError = {
  type: VolleyballIncidentType.ServiceError
  id: number
  description: string
  source: string
  set: number
  score: HomeGuest<number>
  participant: number
}

export type VolleyballIncidentTimeout = {
  type: VolleyballIncidentType.Timeout | VolleyballIncidentType.TimeoutStart | VolleyballIncidentType.TimeoutEnd
  id: number
  description: string
  source: string
  participant: number
  set: number
}

export type VolleyballIncidentAce = {
  type: VolleyballIncidentType.Ace
  id: number
  description: string
  source: string
  set: number
  score: HomeGuest<number>
  participant: number
}

export type VolleyballIncidentMatchDelay = {
  type: VolleyballIncidentType.MatchDelay
  id: number
  description: string
  source: string
}

export type VolleyballIncidentPlayersOnCort = {
  type: VolleyballIncidentType.PlayersOnCort
  id: number
  description: string
  source: string
}

export type VolleyballIncidentPlayersWarmingUp = {
  type: VolleyballIncidentType.PlayersWarmingUp
  id: number
  description: string
  source: string
}

export type VolleyballIncidentService = {
  type: VolleyballIncidentType.Service
  id: number
  description: string
  source: string
  set: number
  participant: number
}

export type VolleyballIncidets = Array<VolleyballIncidentMatchStart | VolleyballIncidentMatchEnd | VolleyballIncidentSetStart | VolleyballIncidentSetEnd | VolleyballIncidentFirstServer | VolleyballIncidentRally | VolleyballIncidentPointWon | VolleyballIncidentServiceError | VolleyballIncidentTimeout | VolleyballIncidentAce | VolleyballIncidentMatchDelay | VolleyballIncidentPlayersOnCort | VolleyballIncidentPlayersWarmingUp | VolleyballIncidentService>

export type TimeLine = SoccerIncidens | BasketballIncidens | TennisIncidents | VolleyballIncidets

export type Clock = {
  clock_direction: 'up' | 'down'
  clock_seconds: number
  clock_status: 'running' | 'stopped'
  clock_tm: string
}

type LiveStatisticSocketData = {
  id: string
  fixture: {
    status: Status
    virtualCourtId: string
  } | null
  live: {
    scoreBoard: ScoreBoard | null
    stats: Stats | null
    timeline: TimeLine | null
    jerseyColors: HomeGuest<string> | null
    clock: Clock | null
  } | null
}[]

export type LiveStatistics = {
  status: Status | null
  scoreBoard: ScoreBoard | null
  stats: Stats | null
  virtualCourtId: string | null
  timeline: TimeLine | null
  jerseyColors: HomeGuest<string> | null
  clock: Clock | null
}

const LiveStatisticsSocketContext = createContext<LiveStatisticsSocket | null>(null)

export const useLiveStatisticsSocket = () => {
  return useContext(LiveStatisticsSocketContext) as LiveStatisticsSocket
}

export const LiveStatisticsSocketProvider: React.FC<any> = ({ children }) => {
  const { socket: socketUrl } = useChain()
  const [ socket, setSocket ] = useState<WebSocket>()
  const isSocketReady = socket?.readyState === WebSocket.OPEN

  const isConnectedRef = useRef(false)
  const prevSocketUrl = useRef(socketUrl) // TODO
  const subscribers = useRef<Record<string, number>>({})

  const subscribe = useCallback((weights: Record<string, number>) => {
    if (socket?.readyState !== 1) {
      return
    }

    Object.keys(weights).forEach((gameId) => {
      if (typeof subscribers.current[gameId] === 'undefined') {
        subscribers.current[gameId] = 0
      }

      subscribers.current[gameId] += weights[gameId]!
    })

    socket.send(JSON.stringify({
      action: 'subscribe',
      gameIds: Object.keys(weights),
    }))
  }, [ socket ])

  const unsubscribeCall = (gameIds: string[]) => {
    if (socket?.readyState !== 1) {
      return
    }

    socket.send(JSON.stringify({
      action: 'unsubscribe',
      gameIds,
    }))
  }

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

  const connect = () => {
    if (isConnectedRef.current) {
      return
    }

    isConnectedRef.current = true

    const newSocket = new WebSocket(`${socketUrl}/statistics/games`)

    const handleOpen = () => {
      setSocket(newSocket)
    }
    const handleClose = (event: CloseEvent) => {
      setSocket(undefined)
      isConnectedRef.current = false

      newSocket.removeEventListener('open', handleOpen)
      newSocket.removeEventListener('message', handleMessage)
      newSocket.removeEventListener('close', handleClose)
      newSocket.removeEventListener('error', handleError)

      if (event.code !== SocketCloseReason.Unmount) {
        setTimeout(connect, 1000)
      }
    }
    const handleError = () => {
      isConnectedRef.current = false
    }

    const handleMessage = (message: MessageEvent<LiveStatisticSocketData>) => {
      JSON.parse(message.data.toString()).forEach((data: LiveStatisticSocketData[0]) => {
        const { id, fixture, live } = data

        let statsData: LiveStatistics = {
          status: fixture?.status || null,
          scoreBoard: live?.scoreBoard || null,
          stats: live?.stats || null,
          virtualCourtId: fixture?.virtualCourtId || null,
          timeline: live?.timeline || null,
          jerseyColors: live?.jerseyColors || null,
          clock: live?.clock || null,
        }

        liveStatisticWatcher.dispatch(id, statsData)
      })
    }

    newSocket.addEventListener('open', handleOpen)
    newSocket.addEventListener('message', handleMessage)
    newSocket.addEventListener('close', handleClose)
    newSocket.addEventListener('error', handleError)
  }

  useEffect(() => {
    connect()

    return () => {
      socket?.close()
    }
  }, [])

  useEffect(() => {
    if (!socket || !isSocketReady || prevSocketUrl.current === socketUrl) {
      return
    }

    socket.close()
    prevSocketUrl.current = socketUrl
  }, [ socketUrl, isSocketReady ])

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
