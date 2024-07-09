import { type ApolloQueryResult, type ApolloClient } from '@apollo/client'
import { type PrematchConditionsBatchQuery, PrematchConditionsBatchDocument } from '@azuro-org/toolkit'

import { createBatch } from './createBatch'


type Result = ApolloQueryResult<PrematchConditionsBatchQuery>

const getConditions = (conditionIds: string[], client: ApolloClient<object>) => {
  return client.query<PrematchConditionsBatchQuery>({
    query: PrematchConditionsBatchDocument,
    variables: {
      conditionFilter: {
        conditionId_in: conditionIds,
      },
    },
    fetchPolicy: 'network-only',
  })
}

type Func = typeof getConditions

export const batchFetchConditions = createBatch<Result, Func>(getConditions)
