import { useEffect, useState } from 'react'

import { useLiveStatisticsSocket, type LiveStatisticsData } from '../../contexts/liveStatisticsSocket'
import { liveStatisticWatcher } from '../../modules/liveStatisticWatcher'


export const useLiveStatistics = (gameId: string) => {
  const [ statistics, setStatistics ] = useState<LiveStatisticsData>()
  const { subscribeToUpdates, unsubscribeToUpdates, isSocketReady } = useLiveStatisticsSocket()

  const isFetching = !statistics

  useEffect(() => {
    if (!isSocketReady) {
      return
    }

    subscribeToUpdates([ gameId ])

    return () => {
      unsubscribeToUpdates([ gameId ])
    }
  }, [ gameId, isSocketReady ])


  useEffect(() => {
    setStatistics(undefined)
    const unsubscribe = liveStatisticWatcher.subscribe(gameId, async (stats) => {
      setStatistics(stats)
    })

    return () => {
      unsubscribe()
    }
  }, [ gameId ])

  return {
    statistics,
    isFetching,
  }
}
