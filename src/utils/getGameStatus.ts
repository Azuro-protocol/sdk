import { GameStatus as GraphGameStatus } from '../docs/live/types'


const getIsPendingResolution = (startDate: number): boolean => {
  const now = Date.now()
  const isStarted = startDate < now
  const pendingResolutionDate = startDate + 6000000

  return isStarted && pendingResolutionDate < now
}

export enum GameStatus {
  Created,
  Live,
  Resolved,
  Canceled,
  Paused,
  PendingResolution,
}

type Props = {
  graphStatus: GraphGameStatus,
  startsAt: number
  isGameInLive: boolean
}

export const getGameStatus = (props: Props): GameStatus => {
  const { graphStatus, startsAt, isGameInLive } = props

  const startDate = startsAt * 1000
  const isStarted = startDate < Date.now()

  // we use LiveGameStatus enum for conditions because it contains PrematchGameStatus
  if (graphStatus === GraphGameStatus.Canceled) {
    return GameStatus.Canceled
  }

  if (graphStatus === GraphGameStatus.Paused) {
    return GameStatus.Paused
  }

  if (graphStatus === GraphGameStatus.Resolved) {
    return GameStatus.Resolved
  }

  if (graphStatus === GraphGameStatus.Finished) {
    return GameStatus.PendingResolution
  }

  if (isStarted) {
    if (!isGameInLive && getIsPendingResolution(startDate)) {
      return GameStatus.PendingResolution
    }

    return GameStatus.Live
  }

  return GameStatus.Created
}
