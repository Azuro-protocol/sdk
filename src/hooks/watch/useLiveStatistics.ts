import { useEffect, useState } from 'react'
import { GameStatus } from '@azuro-org/toolkit'

import { useLiveStatisticsSocket, type LiveStatisticsData } from '../../contexts/liveStatisticsSocket'
import { liveStatisticWatcher } from '../../modules/liveStatisticWatcher'
import { LIVE_STATISTICS_SUPPORTED_SPORTS } from '../../config'


type Props = {
  gameId: string
  sportId: number
  gameStatus: GameStatus
}

export const useLiveStatistics = ({ gameId, sportId, gameStatus }: Props) => {
  const [ statistics, setStatistics ] = useState<LiveStatisticsData>()
  const { subscribeToUpdates, unsubscribeToUpdates, isSocketReady } = useLiveStatisticsSocket()

  const skip = !LIVE_STATISTICS_SUPPORTED_SPORTS.includes(sportId) || gameStatus !== GameStatus.Live
  const isFetching = !statistics

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
    setStatistics(undefined)

    if (skip) {
      return
    }

    const unsubscribe = liveStatisticWatcher.subscribe(gameId, async (stats) => {
      setStatistics(stats)
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
