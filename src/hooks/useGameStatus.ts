import { useEffect, useMemo, useState } from 'react'

import { getGameStatus, type GameStatus } from '../utils/getGameStatus'
import type { GameStatus as LiveGameStatus } from '../docs/live/types'
import type { GameStatus as PrematchGameStatus } from '../docs/prematch/types'


enum LiveGameState {
  CREATED,
  FINISHED,
  CANCELED
}

type Props = {
  gameId: string
  startsAt: number
  initialStatus: LiveGameStatus | PrematchGameStatus
  isGameExistInLive: boolean
}

export const useGameStatus = ({ gameId, initialStatus, startsAt, isGameExistInLive }: Props) => {
  const startDate = +startsAt * 1000
  const [ isGameStarted, setGameStarted ] = useState(Date.now() > startDate)
  const [ graphStatus, setGraphStatus ] = useState(initialStatus)
  const [ isGameInLive, setGameInLive ] = useState(isGameExistInLive)

  const gameStatus = useMemo<GameStatus>(() => {
    return getGameStatus({
      graphStatus,
      startsAt,
      isGameInLive,
    })
  }, [ graphStatus, isGameStarted, isGameInLive ])

  useEffect(() => {
    if (isGameStarted) {
      return
    }

    const timer = setTimeout(() => {
      setGameStarted(true)
    }, startDate - Date.now())

    return () => {
      clearTimeout(timer)
    }
  }, [ startDate ])

  // useEffect(() => {
  //   const handler = (liveState: LiveGameState) => {
  //     setGameInLive(true)

  //     if (liveState === LiveGameState.CANCELED) {
  //       setGraphStatus(LiveGameStatus.Canceled)
  //     }

  //     if (liveState === LiveGameState.CREATED) {
  //       setGraphStatus(LiveGameStatus.Created)
  //     }

  //     if (liveState === LiveGameState.FINISHED) {
  //       setGraphStatus(LiveGameStatus.Finished)
  //     }
  //   }

  //   const unsubscribe = events.subscribe(`${AggregatorEvents.LiveGameUpdated}-${gameId}`, handler)

  //   return () => {
  //     unsubscribe()
  //   }
  // }, [])

  return {
    status: gameStatus,
    isGameInLive,
    isGameStarted,
  }
}
