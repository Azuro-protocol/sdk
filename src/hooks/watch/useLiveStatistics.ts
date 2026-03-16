import { useEffect, useRef, useState } from 'react'
import { GameState, getProviderFromId } from '@azuro-org/toolkit'

import { useLiveStatisticsSocket, type LiveStatistics } from '../../contexts/liveStatisticsSocket'
import { liveStatisticWatcher } from '../../modules/liveStatisticWatcher'
import { LIVE_STATISTICS_SUPPORTED_PROVIDERS, LIVE_STATISTICS_SUPPORTED_SPORTS } from '../../config'


export type UseLiveStatisticsProps = {
  gameId: string
  sportId: number | string
  gameState: GameState
  enabled?: boolean
}

/**
 * Watch real-time live game statistics (scores, periods, etc.) via websocket.
 * Only works for live games from supported providers and sports.
 *
 * Returns `isAvailable` to check if statistics are supported for the game.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch/useLiveStatistics
 *
 * @example
 * import { useLiveStatistics, GameState } from '@azuro-org/sdk'
 *
 * const { data: statistics, isFetching, isAvailable } = useLiveStatistics({
 *   gameId: '123456789',
 *   sportId: 33,
 *   gameState: GameState.Live
 * })
 * */
export const useLiveStatistics = ({ gameId, sportId, gameState, enabled = true }: UseLiveStatisticsProps) => {
  const [ statistics, setStatistics ] = useState<LiveStatistics | null>()
  const { subscribeToUpdates, unsubscribeToUpdates, isSocketReady } = useLiveStatisticsSocket()

  const providerId = getProviderFromId(gameId)
  const isSportAllowed = LIVE_STATISTICS_SUPPORTED_SPORTS.includes(+sportId)
  const isProviderAllowed = LIVE_STATISTICS_SUPPORTED_PROVIDERS.includes(providerId)
  const isGameInLive = gameState === GameState.Live
  const skip = (
    !enabled ||
    !gameId ||
    !sportId ||
    !isSportAllowed ||
    !isProviderAllowed ||
    !isGameInLive
  )
  const isAvailable = isSportAllowed && isGameInLive && isProviderAllowed

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
    data: statistics,
    isFetching,
    isAvailable,
  }
}
