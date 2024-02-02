import { GameStatus, getGameStatus } from './getGameStatus'
import { BetStatus as GraphBetStatus } from '../docs/prematch/types'
import { type GameQuery } from '../docs/prematch/game'


export enum BetStatus {
  Accepted,
  Live,
  PendingResolution,
  Resolved,
  Canceled,
}

type Game = Pick<GameQuery['games'][0], 'status' | 'startsAt'>

const getExpressIsLive = (games: Game[]) => {
  const firstStartDate = Math.min(...games.map(({ startsAt }) => +startsAt))

  return +firstStartDate * 1000 < Date.now()
}

const getExpressIsPendingResolution = (games: Game[]) => {
  const lastStartDate = Math.max(...games.map(({ startsAt }) => +startsAt))
  const lastGames = games.filter(({ startsAt }) => +startsAt === lastStartDate)

  return lastGames.some(({ status, startsAt }) => {
    return getGameStatus({ graphStatus: status, startsAt: +startsAt, isGameInLive: false }) === GameStatus.PendingResolution
  })
}

type Props = {
  games: Game[]
  graphStatus: GraphBetStatus
  isLiveBet: boolean
}

export const getBetStatus = (props: Props): BetStatus => {

  const { games, graphStatus, isLiveBet } = props

  if (graphStatus === GraphBetStatus.Canceled) {
    return BetStatus.Canceled
  }

  if (graphStatus === GraphBetStatus.Resolved) {
    return BetStatus.Resolved
  }

  const isExpress = games.length > 1

  const isPendingResolution = isExpress
    ? getExpressIsPendingResolution(games)
    : getGameStatus({ graphStatus: games[0]!.status, startsAt: +games[0]!.startsAt, isGameInLive: isLiveBet }) === GameStatus.PendingResolution

  if (isPendingResolution) {
    return BetStatus.PendingResolution
  }

  const isLive = isExpress
    ? getExpressIsLive(games)
    : getGameStatus({ graphStatus: games[0]!.status, startsAt: +games[0]!.startsAt, isGameInLive: isLiveBet }) === GameStatus.Live

  if (isLive) {
    return BetStatus.Live
  }

  return BetStatus.Accepted
}
