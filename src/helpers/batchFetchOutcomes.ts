import { request } from 'graphql-request'
import {
  type ConditionState,
  type ConditionsBatchQuery,
  type ConditionsBatchQueryVariables,
  ConditionsBatchDocument,
} from '@azuro-org/toolkit'

import { createBatch } from './createBatch'


type OutcomeData = {
  state: ConditionState
  odds: number
}

type Result = Record<string, OutcomeData>

const getOutcomes = async (conditionEntityIds: string[], gqlLink: string) => {
  const { conditions } = await request<ConditionsBatchQuery, ConditionsBatchQueryVariables>({
    url: gqlLink,
    document: ConditionsBatchDocument,
    variables: {
      conditionFilter: {
        id_in: conditionEntityIds,
      },
    },
  })

  return conditions.reduce<Result>((acc, { conditionId, outcomes, state }) => {
    outcomes.forEach(({ outcomeId, odds }) => {
      const key = `${conditionId}-${outcomeId}`
      acc[key] = {
        odds: +odds,
        state,
      }
    })

    return acc
  }, {})
}

type Func = typeof getOutcomes

export const batchFetchOutcomes = createBatch<Result, Func>(getOutcomes)
