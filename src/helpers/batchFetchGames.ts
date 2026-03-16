import {
  getGamesByIds,
  type ChainId,
  type GameData,
} from '@azuro-org/toolkit'

import { createBatch } from './createBatch'


type Result = Record<string, GameData>

const getGames = async (gameIds: string[], chainId: ChainId) => {
  const games = await getGamesByIds({ gameIds, chainId })

  return games.reduce<Result>((acc, game) => {
    const { gameId } = game

    acc[gameId] = game

    return acc
  }, {})
}

type Func = typeof getGames

export const batchFetchGames = createBatch<Result, Func>(getGames)
