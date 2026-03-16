import { useEffect, useState } from 'react'
import { GameState } from '@azuro-org/toolkit'

import { gameWathcer } from '../../modules/gameWathcer'
import { useGameUpdates } from '../../contexts/gameUpdates'


export type UseGameStateProps = {
  gameId: string
  initialState: GameState
}

/**
 * Watch real-time game state updates (e.g., Prematch, Live, Finished).
 * Subscribes to game updates via websocket and tracks state changes.
 *
 * Automatically skips subscription if the game is already finished.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/watch/useGameState
 *
 * @example
 * import { useGameState, GameState } from '@azuro-org/sdk'
 *
 * const { data: state } = useGameState({
 *   gameId: game.gameId,
 *   initialState: GameState.Prematch
 * })
 * */
export const useGameState = ({ gameId, initialState }: UseGameStateProps) => {
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useGameUpdates()

  const skip = initialState === GameState.Finished
  const [ state, setState ] = useState(initialState)

  useEffect(() => {
    if (!isSocketReady || skip) {
      return
    }

    subscribeToUpdates([ gameId ])

    return () => {
      unsubscribeToUpdates([ gameId ])
    }
  }, [ isSocketReady, gameId, skip ])

  useEffect(() => {
    const unsubscribe = gameWathcer.subscribe(gameId, (data) => {
      const { state: newState } = data

      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [ gameId ])

  return {
    data: state,
  }
}
