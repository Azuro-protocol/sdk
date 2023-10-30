import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { ConditionsDocument, ConditionsQuery, ConditionsQueryVariables } from '../docs/conditions'
import { useChain } from '../contexts/chain'


type UseConditionsProps = {
  gameId: string
  filter?: {
    outcomeIds?: string[]
  }
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameId, filter } = props
  const { contracts } = useChain()

  const options = useMemo<QueryHookOptions<ConditionsQuery, ConditionsQueryVariables>>(() => {
    const gameEntityId = `${contracts.lp.address.toLowerCase()}_${gameId}`

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
    gameId,
    contracts,
    filter?.outcomeIds?.join(',')
  ])

  return useQuery<ConditionsQuery, ConditionsQueryVariables>(ConditionsDocument, options)
}
