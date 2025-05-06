import {
  type ConditionState,
  type ConditionsBatchQuery,
  type ConditionsBatchQueryVariables,
  ConditionsBatchDocument,
} from '@azuro-org/toolkit'

import { createBatch } from './createBatch'
import { gqlRequest } from './gqlRequest'


type Result = Record<string, Omit<ConditionsBatchQuery['conditions'][0], 'outcomes'> & {
  outcomes: Record<string, ConditionsBatchQuery['conditions'][0]['outcomes'][0]>
}>

const getConditions = async (conditionEntityIds: string[], gqlLink: string) => {
  const { conditions } = await gqlRequest<ConditionsBatchQuery, ConditionsBatchQueryVariables>({
    url: gqlLink,
    document: ConditionsBatchDocument,
    variables: {
      conditionFilter: {
        id_in: conditionEntityIds,
      },
    },
  })

  return conditions.reduce<Result>((acc, condition) => {
    const { conditionId, outcomes: _outcomes } = condition

    const outcomes = _outcomes.reduce<Record<string, ConditionsBatchQuery['conditions'][0]['outcomes'][0]>>((acc, outcome) => {
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
