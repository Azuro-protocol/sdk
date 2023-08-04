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

  const options = useMemo<QueryHookOptions<ConditionsQuery, ConditionsQueryVariables>>(() => ({
    variables: {
      where: {
        game_: {
          id: gameEntityId,
        },
        outcomesIds_contains: filter?.outcomeIds,
      },
    },
    ssr: false,
  }), [
    gameEntityId,
    filter?.outcomeIds?.join(',')
  ])

  return useQuery<ConditionsQuery, ConditionsQueryVariables>(ConditionsDocument, options)
}
