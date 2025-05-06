import {
  type GamesQuery,
  type GamesQueryVariables,
  GamesDocument,
} from '@azuro-org/toolkit'

import { createBatch } from './createBatch'
import { gqlRequest } from './gqlRequest'


type Data = GamesQuery['games'][0]

type Result = Record<string, Data>

const getGames = async (gameIds: string[], gqlLink: string) => {
  const { games } = await gqlRequest<GamesQuery, GamesQueryVariables>({
    url: gqlLink,
    document: GamesDocument,
    variables: {
      where: {
        id_in: gameIds,
      },
    },
  })

  return games.reduce<Result>((acc, game) => {
    const { gameId } = game

    acc[gameId] = game

    return acc
  }, {})
}

type Func = typeof getGames

export const batchFetchGames = createBatch<Result, Func>(getGames)
