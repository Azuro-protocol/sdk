import { type GameQuery, type GameQueryVariables, GameDocument } from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


type UseGameProps = {
  gameId: string
  query?: QueryParameter<GameQuery['game']>
}

export const useGame = (props: UseGameProps) => {
  const { gameId, query = {} } = props

  const { graphql } = useChain()

  const gqlLink = graphql.feed

  return useQuery({
    queryKey: [
      'game',
      gqlLink,
      gameId,
    ],
    queryFn: async () => {
      const variables: GameQueryVariables = {
        id: gameId,
      }

      const { game } = await gqlRequest<GameQuery, GameQueryVariables>({
        url: gqlLink,
        document: GameDocument,
        variables,
      })

      return game
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
