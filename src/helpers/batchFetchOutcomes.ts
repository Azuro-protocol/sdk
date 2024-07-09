import { type ApolloClient } from '@apollo/client'
import {
  type ConditionStatus,
  type PrematchConditionsBatchQuery,
  PrematchConditionsBatchDocument,
} from '@azuro-org/toolkit'

import { createBatch } from './createBatch'


type OutcomeData = {
  status: ConditionStatus
  odds: number
}

type Result = Record<string, OutcomeData>

const getOutcomes = async (conditionEntityIds: string[], client: ApolloClient<object>) => {
  const result = await client.query<PrematchConditionsBatchQuery>({
    query: PrematchConditionsBatchDocument,
    variables: {
      conditionFilter: {
        id_in: conditionEntityIds,
      },
    },
    fetchPolicy: 'network-only',
  })

  return result?.data?.conditions.reduce<Result>((acc, { id: conditionEntityId, outcomes, status }) => {
    outcomes.forEach(({ outcomeId, odds }) => {
      const key = `${conditionEntityId}-${outcomeId}`
      acc[key] = {
        odds: +odds,
        status,
      }
    })

    return acc
  }, {})
}

type Func = typeof getOutcomes

export const batchFetchOutcomes = createBatch<Result, Func>(getOutcomes)
