import { type GameQuery, type GameQueryVariables, GameDocument } from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type UseGameProps = {
  gameId: string
  query?: QueryParameter<GameQuery['game']>
}

export const useGame = (props: UseGameProps) => {
  const { gameId, query = {} } = props

  const { graphql, appChain } = useChain()

  return useQuery({
    queryKey: [
      'game',
      appChain.id,
      gameId,
    ],
    queryFn: async () => {
      const variables: GameQueryVariables = {
        id: gameId,
      }

      const { game } = await request<GameQuery, GameQueryVariables>({
        url: graphql.feed,
        document: GameDocument,
        variables,
      })

      // game = prematchData?.games?.[0]

      // const shouldGetLive = !game || Date.now() >= +game.startsAt * 1000

      // if (shouldGetLive) {
      //   const liveData = await request<GameQuery, GameQueryVariables>({
      //     url: graphql.live,
      //     document: GameDocument,
      //     variables,
      //   })

      //   if (liveData?.games?.[0]) {
      //     game = liveData?.games?.[0]
      //   }
      // }

      return game
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
