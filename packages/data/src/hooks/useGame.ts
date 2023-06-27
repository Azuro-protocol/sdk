import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { GameDocument, GameQueryResult, GameQueryVariables } from '../docs/game'


type UseGameProps = {
  id: string
  withConditions?: boolean
}

export const useGame = (props: UseGameProps) => {
  const { id, withConditions = false } = props

  const options = useMemo(() => {
    const variables: GameQueryVariables = {
      id,
      withConditions,
    }

    return {
      variables,
      ssr: false,
    }
  }, [ id ])

  return useQuery<GameQueryResult, GameQueryVariables>(GameDocument, options)
}
