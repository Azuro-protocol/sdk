import { GameStatus as GraphGameStatus } from '../types';


const isPendingResolution = (startDate: number): boolean => {
  const now = Date.now()
  const isStarted = startDate < now
  const pendingResolutionDate = startDate + 6000000

  return isStarted && pendingResolutionDate < now
}

export enum GameStatus {
  Preparing,
  Live,
  PendingResolution,
  Resolved,
  Canceled,
  Paused,
}

type Props = {
  graphGameStatus: GraphGameStatus,
  startsAt: number
}

export const getGameStatus = (props: Props): GameStatus => {
  const { graphGameStatus, startsAt } = props

  const startDate = startsAt * 1000
  const isStarted = startDate < Date.now()

  if (graphGameStatus === GraphGameStatus.Canceled) {
    return GameStatus.Canceled
  }
  else if (graphGameStatus === GraphGameStatus.Resolved) {
    return GameStatus.Resolved
  }
  else if (isPendingResolution(startDate)) {
    return GameStatus.PendingResolution
  }
  else if (isStarted) {
    return GameStatus.Live
  }
  else if (graphGameStatus === GraphGameStatus.Paused) {
    return GameStatus.Paused
  }

  return GameStatus.Preparing
}
