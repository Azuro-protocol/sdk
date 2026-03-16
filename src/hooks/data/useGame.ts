import {
  type ChainId,
  getGamesByIds,
  type GameData,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


export type UseGameProps = {
  gameId: string
  chainId?: ChainId
  query?: QueryParameter<GameData | null>
}

export type UseGame = (props: UseGameProps) => UseQueryResult<GameData | null>

/**
 * Use it to fetch a specific game by gameId parameter.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useGame
 *
 * @example
 * import { useGame } from '@azuro-org/sdk'
 *
 * // e.g., game page your-app-url/polygon/football/.../{gameId}
 * const { gameId } = useParams<{ gameId: string }>()
 * const { data, isLoading, error } = useGame({ gameId })
 * */
export const useGame: UseGame = (props) => {
  const { gameId, chainId, query = {} } = props

  const { chain } = useOptionalChain(chainId)

  return useQuery({
    queryKey: [
      'game',
      chain.id,
      gameId,
    ],
    queryFn: async () => {
      const games = await getGamesByIds({
        chainId: chain.id,
        gameIds: [ gameId ],
      })

      return games?.[0] || null
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
