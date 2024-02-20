import { type ApolloClient } from '@apollo/client'

import { debounce } from './debounce'
import { type ConditionsBatchQuery, ConditionsBatchDocument } from '../docs/prematch/conditionsBatch'
import type { ConditionStatus } from '../docs/prematch/types'


type OutcomeData = {
  status: ConditionStatus
  odds: number
}

type Result = Record<string, OutcomeData>

let idsWaitList = new Set<string>()
let resolversWaitList: Array<(value?: Result) => void> = []

const fetch = debounce(async (client: ApolloClient<object>) => {
  const conditionEntityIds = [ ...idsWaitList ]
  const resolvers = resolversWaitList

  idsWaitList.clear()
  resolversWaitList = []

  try {
    const result = await client.query<ConditionsBatchQuery>({
      query: ConditionsBatchDocument,
      variables: {
        conditionFilter: {
          id_in: conditionEntityIds,
        },
      },
      fetchPolicy: 'network-only',
    })

    const data = result?.data?.conditions.reduce<Result>((acc, { id: conditionEntityId, outcomes, status }) => {
      outcomes.forEach(({ outcomeId, odds }) => {
        const key = `${conditionEntityId}-${outcomeId}`
        acc[key] = {
          odds: +odds,
          status,
        }
      })

      return acc
    }, {})

    resolvers.forEach((resolve) => {
      resolve(data)
    })
  }
  catch (err) {
    resolvers.forEach((resolve) => {
      resolve(undefined)
    })
  }
}, 50)

export const batchFetchOutcome = (conditionEntityId: string, client: ApolloClient<object>) => {
  fetch(client)
  idsWaitList.add(conditionEntityId)

  return new Promise<Result | undefined>((resolve) => {
    resolversWaitList.push(resolve)
  })
}
