import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { ConditionsDocument, ConditionsQueryResult, ConditionsQueryVariables } from '../docs/conditions'


type UseConditionsProps = {
  gameEntityId: string
  filter?: {
    outcomeIds?: string[]
  }
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameEntityId, filter } = props

  const options = useMemo(() => {
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

  return useQuery<ConditionsQueryResult, ConditionsQueryVariables>(ConditionsDocument, options)
}
