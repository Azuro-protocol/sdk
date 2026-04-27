import {
  getConditionsByGameIds,
  type ChainId,
  type ConditionDetailedData,
} from '@azuro-org/toolkit'

import { createBatch } from './createBatch'


type Result = Record<string, ConditionDetailedData[]>

const getGamesConditions = async (gameIds: string[], chainId: ChainId) => {
  const conditions = await getConditionsByGameIds({ gameIds, chainId })

  return conditions.reduce<Result>((acc, condition) => {
    const { gameId } = condition.game

    if (!acc[gameId]) {
      acc[gameId] = []
    }

    acc[gameId].push(condition)

    return acc
  }, {})
}

type Func = typeof getGamesConditions

export const batchFetchGameConditions = createBatch<Result, Func>(getGamesConditions)
