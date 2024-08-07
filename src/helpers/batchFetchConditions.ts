import { type ApolloQueryResult, type ApolloClient } from '@apollo/client'
import { type PrematchConditionsBatchQuery, PrematchConditionsBatchDocument } from '@azuro-org/toolkit'

import { createBatch } from './createBatch'


type Result = ApolloQueryResult<PrematchConditionsBatchQuery>

const getConditions = (conditionEntityIds: string[], client: ApolloClient<object>) => {
  return client.query<PrematchConditionsBatchQuery>({
    query: PrematchConditionsBatchDocument,
    variables: {
      conditionFilter: {
        id_in: conditionEntityIds,
      },
    },
    fetchPolicy: 'network-only',
  })
}

type Func = typeof getConditions

export const batchFetchConditions = createBatch<Result, Func>(getConditions)
