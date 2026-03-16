import {
  getConditionsState,
  type ConditionStateData,
  type ChainId,
} from '@azuro-org/toolkit'

import { createBatch } from './createBatch'


type Result = Record<string, Omit<ConditionStateData, 'outcomes'> & {
  outcomes: Record<string, ConditionStateData['outcomes'][0]>
}>

const getConditions = async (conditionEntityIds: string[], chainId: ChainId) => {
  const conditions = await getConditionsState({
    chainId,
    conditionIds: conditionEntityIds,
  })

  return conditions.reduce<Result>((acc, condition) => {
    const { conditionId, outcomes: _outcomes } = condition

    const outcomes = _outcomes.reduce<Record<string, ConditionStateData['outcomes'][0]>>((acc, outcome) => {
      acc[outcome.outcomeId] = outcome

      return acc
    }, {})

    acc[conditionId] = {
      ...condition,
      outcomes,
    }

    return acc
  }, {})
}

type Func = typeof getConditions

export const batchFetchConditions = createBatch<Result, Func>(getConditions)
