import { useEffect, useMemo, useState } from 'react'

import { getGameStatus, type GameStatus } from '../utils/getGameStatus'
import type { GameStatus as LiveGameStatus } from '../docs/live/types'
import type { GameStatus as PrematchGameStatus } from '../docs/prematch/types'


type Props = {
  startsAt: number
  graphStatus: LiveGameStatus | PrematchGameStatus
  isGameExistInLive: boolean
}

export const useGameStatus = ({ graphStatus, startsAt, isGameExistInLive }: Props) => {
  const startDate = +startsAt * 1000
  const [ isGameStarted, setGameStarted ] = useState(Date.now() > startDate)

  const gameStatus = useMemo<GameStatus>(() => {
    return getGameStatus({
      graphStatus,
      startsAt,
      isGameInLive: isGameExistInLive,
    })
  }, [ graphStatus, isGameStarted, isGameExistInLive ])

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

  return {
    status: gameStatus,
    isGameStarted,
  }
}
