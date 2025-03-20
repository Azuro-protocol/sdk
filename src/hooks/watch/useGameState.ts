import { useEffect, useState } from 'react'
import { type GameState } from '@azuro-org/toolkit'

import { gameWathcer } from '../../modules/gameWathcer'
import { useConditionUpdates } from '../../contexts/conditionUpdates'


type Props = {
  gameId: string
  initialState: GameState
}

export const useGameState = ({ gameId, initialState }: Props) => {
  const { isSocketReady, subscribeToUpdates, unsubscribeToUpdates } = useConditionUpdates()

  const [ state, setState ] = useState(initialState)

  useEffect(() => {
    if (!isSocketReady) {
      return
    }

    subscribeToUpdates([ gameId ])

    return () => {
      unsubscribeToUpdates([ gameId ])
    }
  }, [ isSocketReady, gameId ])

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
