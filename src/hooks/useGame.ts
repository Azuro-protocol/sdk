import { useMemo } from 'react'
import { useQuery } from '@apollo/client'

import type { GameQuery, GameQueryVariables } from '../docs/prematch/game'
import { GameDocument } from '../docs/prematch/game'
import { useApolloClients } from '../contexts/apollo'


type UseGameProps = {
  gameId: string | bigint
}

export const useGame = (props: UseGameProps) => {
  const { gameId } = props

  const { prematchClient, liveClient } = useApolloClients()

  const variables = useMemo<GameQueryVariables>(() => ({
    gameId: gameId!,
  }), [ gameId ])

  const { data: prematchData, loading: isPrematchLoading, error: prematchError } = useQuery<GameQuery, GameQueryVariables>(GameDocument, {
    variables,
    ssr: false,
    client: prematchClient!,
    skip: !gameId,
  })

  const { data: liveData, loading: isLiveLoading, error: liveError } = useQuery<GameQuery, GameQueryVariables>(GameDocument, {
    variables,
    ssr: false,
    client: liveClient!,
    skip: !gameId,
  })

  const prematchGame = prematchData?.games?.[0]
  const liveGame = liveData?.games?.[0]

  const game = liveGame || prematchGame
  const isGameInLive = Boolean(liveGame)

  return {
    game,
    loading: isPrematchLoading || isLiveLoading,
    error: prematchError || liveError,
    isGameInLive,
  }
}
