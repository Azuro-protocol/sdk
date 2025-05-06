import {
  type Condition_Filter,
  type ConditionsQuery,
  type ConditionsQueryVariables,
  type Condition_OrderBy,
  type OrderDirection,

  ConditionsDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


type UseConditionsProps = {
  gameId: string | bigint
  filter?: Condition_Filter
  orderBy?: Condition_OrderBy
  orderDir?: OrderDirection
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameId, filter = {}, orderBy, orderDir, query = {} } = props
  const { graphql } = useChain()

  const gqlLink = graphql.feed

  return useQuery({
    queryKey: [
      'conditions',
      gqlLink,
      gameId,
      orderBy,
      orderDir,
      filter,
    ],
    queryFn: async () => {
      const variables: ConditionsQueryVariables = {
        orderBy,
        orderDirection: orderDir,
        where: {
          ...filter,
          game_: {
            gameId,
          },
        },
      }

      const { conditions } = await gqlRequest<ConditionsQuery, ConditionsQueryVariables>({
        url: gqlLink,
        document: ConditionsDocument,
        variables,
      })

      return conditions
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
