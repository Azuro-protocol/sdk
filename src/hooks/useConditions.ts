import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { ConditionsDocument, ConditionsQuery, ConditionsQueryVariables } from '../docs/conditions'


type UseConditionsProps = {
  gameEntityId: string
  filter?: {
    outcomeIds?: string[]
  }
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameEntityId, filter } = props

  const options = useMemo<QueryHookOptions<ConditionsQuery, ConditionsQueryVariables>>(() => {
    const variables: ConditionsQueryVariables = {
      where: {
        game_: {
          id: gameEntityId,
        },
      },
    }

    if (filter?.outcomeIds) {
      variables.where.outcomesIds_contains = filter.outcomeIds
    }

    return {
      variables,
      ssr: false,
    }
  }, [
    gameEntityId,
    filter?.outcomeIds?.join(',')
  ])

  return useQuery<ConditionsQuery, ConditionsQueryVariables>(ConditionsDocument, options)
}
