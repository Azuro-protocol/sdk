import { type GameQuery, type GameQueryVariables, type ChainId, GameDocument } from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


type UseGameProps = {
  gameId: string
  chainId?: ChainId
  query?: QueryParameter<GameQuery['game']>
}

export const useGame = (props: UseGameProps) => {
  const { gameId, chainId, query = {} } = props

  const { graphql } = useOptionalChain(chainId)

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
