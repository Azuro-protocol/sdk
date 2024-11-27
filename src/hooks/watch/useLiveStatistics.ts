import { useEffect, useState } from 'react'
import { GameStatus } from '@azuro-org/toolkit'

import { useLiveStatisticsSocket, type LiveStatisticsData } from '../../contexts/liveStatisticsSocket'
import { liveStatisticWatcher } from '../../modules/liveStatisticWatcher'
import { LIVE_STATISTICS_SUPPORTED_SPORTS } from '../../config'


type Props = {
  gameId: string
  sportId: number | string
  gameStatus: GameStatus
  enabled?: boolean
}

export const useLiveStatistics = ({ gameId, sportId, gameStatus, enabled = true }: Props) => {
  const [ statistics, setStatistics ] = useState<LiveStatisticsData | null>()
  const { subscribeToUpdates, unsubscribeToUpdates, isSocketReady } = useLiveStatisticsSocket()

  const skip = (
    !enabled ||
    !gameId ||
    !sportId ||
    !LIVE_STATISTICS_SUPPORTED_SPORTS.includes(+sportId) ||
    gameStatus !== GameStatus.Live
  )
  const isFetching = !skip && !statistics && statistics !== null

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
