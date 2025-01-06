import { useEffect, useRef, useState } from 'react'
import { GameStatus } from '@azuro-org/toolkit'

import { useLiveStatisticsSocket, type LiveStatistics } from '../../contexts/liveStatisticsSocket'
import { liveStatisticWatcher } from '../../modules/liveStatisticWatcher'
import { LIVE_STATISTICS_SUPPORTED_SPORTS } from '../../config'


type Props = {
  gameId: string
  sportId: number | string
  gameStatus: GameStatus
  enabled?: boolean
}

// TODO: check provider id?
export const useLiveStatistics = ({ gameId, sportId, gameStatus, enabled = true }: Props) => {
  const [ statistics, setStatistics ] = useState<LiveStatistics | null>()
  const { subscribeToUpdates, unsubscribeToUpdates, isSocketReady } = useLiveStatisticsSocket()

  const skip = (
    !enabled ||
    !gameId ||
    !sportId ||
    !LIVE_STATISTICS_SUPPORTED_SPORTS.includes(+sportId) ||
    gameStatus !== GameStatus.Live
  )

  let isFetching = !skip && !statistics && statistics !== null

  const prevGameIdRef = useRef(gameId)

  if (prevGameIdRef.current !== gameId) {
    setStatistics(undefined)

    if (!skip) {
      isFetching = true
    }
  }

  prevGameIdRef.current = gameId

  useEffect(() => {
    if (!isSocketReady || skip) {
      return
    }

    subscribeToUpdates([ gameId ])

    return () => {
      unsubscribeToUpdates([ gameId ])
    }
  }, [ skip, gameId, isSocketReady ])


  useEffect(() => {
    if (skip) {
      return
    }

    const unsubscribe = liveStatisticWatcher.subscribe(gameId, async (data) => {
      if (data.stats === null) {
        setStatistics(null)
      }
      else {
        setStatistics(data)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [ skip, gameId ])

  return {
    statistics,
    isFetching,
  }
}
