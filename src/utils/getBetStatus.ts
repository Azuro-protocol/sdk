import { GameStatus, getGameStatus } from './getGameStatus'
import { type Bet } from '../hooks/useBets';
import { BetStatus as GraphBetStatus } from '../types';

export enum BetStatus {
  Accepted,
  Live,
  PendingResolution,
  Canceled,
  Won,
  Lost,
}

type Game = Pick<Bet['outcomes'][0]['game'], 'status' | 'startsAt'>

const getExpressIsLive = (games: Game[]) => {
  const firstStartDate = Math.min(...games.map(({ startsAt }) => startsAt))

  return +firstStartDate * 1000 < Date.now()
}

const getExpressIsPendingResolution = (games: Game[]) => {
  const lastStartDate = Math.max(...games.map(({ startsAt }) => startsAt))
  const lastGames = games.filter(({ startsAt }) => startsAt === lastStartDate)

  return lastGames.some(({ status, startsAt }) => {
    return getGameStatus({ graphStatus: status, startsAt }) === GameStatus.PendingResolution
  })
}

type Props = {
  games: Game[]
  graphStatus: GraphBetStatus
  win: boolean
  lose: boolean
}

export const getBetStatus = (props: Props): BetStatus => {
  const { games, graphStatus, win, lose } = props

  if (graphStatus === GraphBetStatus.Canceled) {
    return BetStatus.Canceled
  }

  if (win) {
    return BetStatus.Won
  }

  if (lose) {
    return BetStatus.Lost
  }

  const isExpress = games.length > 1

  const gameStatus = getGameStatus({ graphStatus: games[0]!.status, startsAt: games[0]!.startsAt })

  const isPendingResolution = isExpress
    ? getExpressIsPendingResolution(games)
    : gameStatus === GameStatus.PendingResolution

  if (isPendingResolution) {
    return BetStatus.PendingResolution
  }

  const isLive = isExpress
    ? getExpressIsLive(games)
    : gameStatus === GameStatus.Live

  if (isLive) {
    return BetStatus.Live
  }

  return BetStatus.Accepted
}
