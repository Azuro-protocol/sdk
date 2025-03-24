import { useEffect, useState } from 'react'
import { GameState } from '@azuro-org/toolkit'

import { gameWathcer } from '../../modules/gameWathcer'
import { useGameUpdates } from '../../contexts/gameUpdates'


type Props = {
  gameId: string
  initialState: GameState
}

export const useGameState = ({ gameId, initialState }: Props) => {
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
