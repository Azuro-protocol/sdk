import { type ApolloQueryResult, type ApolloClient } from '@apollo/client'

import { type ConditionsBatchQuery, ConditionsBatchDocument } from '../docs/prematch/conditionsBatch'
import createBatch from './createBatch'


type Result = ApolloQueryResult<ConditionsBatchQuery>

const getConditions = async (conditionIds: string[], client: ApolloClient<object>) => {
  return await client.query<ConditionsBatchQuery>({
    query: ConditionsBatchDocument,
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
