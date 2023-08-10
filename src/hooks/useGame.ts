import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { GameDocument, GameQuery, GameQueryVariables } from '../docs/game'


type UseGameProps = {
  id: string
}

export const useGame = (props: UseGameProps) => {
  const { id } = props

  const options = useMemo<QueryHookOptions<GameQuery, GameQueryVariables>>(() => ({
    variables: {
      id: id!,
    },
    skip: !id,
    ssr: false,
  }), [ id ])

  return useQuery<GameQuery, GameQueryVariables>(GameDocument, options)
}
