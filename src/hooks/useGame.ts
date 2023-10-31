import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { GameDocument, GameQuery, GameQueryVariables } from '../docs/game'


type UseGameProps = {
  gameId: string | bigint
}

export const useGame = (props: UseGameProps) => {
  const { gameId } = props

  const options = useMemo<QueryHookOptions<GameQuery, GameQueryVariables>>(() => ({
    variables: {
      gameId: gameId!,
    },
    skip: !gameId,
    ssr: false,
  }), [ gameId ])

  const { data, ...rest } = useQuery<GameQuery, GameQueryVariables>(GameDocument, options)

  return {
    ...rest,
    data: data?.games?.[0],
  }
}
