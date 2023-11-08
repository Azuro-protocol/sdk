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
  graphStatus: GraphGameStatus,
  startsAt: number
}

export const getGameStatus = (props: Props): GameStatus => {
  const { graphStatus, startsAt } = props

  const startDate = startsAt * 1000
  const isStarted = startDate < Date.now()

  if (graphStatus === GraphGameStatus.Canceled) {
    return GameStatus.Canceled
  }
  
  if (graphStatus === GraphGameStatus.Resolved) {
    return GameStatus.Resolved
  }
  
  if (isPendingResolution(startDate)) {
    return GameStatus.PendingResolution
  }
  
  if (isStarted) {
    return GameStatus.Live
  }
  
  if (graphStatus === GraphGameStatus.Paused) {
    return GameStatus.Paused
  }

  return GameStatus.Preparing
}
