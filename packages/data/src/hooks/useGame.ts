import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { GameDocument, GameQuery, GameQueryVariables } from '../docs/game'


type UseGameProps = {
  id: string | undefined
  withConditions?: boolean
}

export const useGame = (props: UseGameProps) => {
  const { id, withConditions = false } = props

  const options = useMemo<QueryHookOptions<GameQuery, GameQueryVariables>>(() => ({
    variables: {
      id: id!,
      withConditions,
    },
    skip: !id,
    ssr: false,
  }), [ id ])

  return useQuery<GameQuery, GameQueryVariables>(GameDocument, options)
}
