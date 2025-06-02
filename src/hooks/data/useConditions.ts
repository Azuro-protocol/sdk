import {
  type Condition_Filter,
  type ConditionsQuery,
  type ConditionsQueryVariables,
  type Condition_OrderBy,
  type OrderDirection,
  type ChainId,

  ConditionsDocument,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


export type UseConditionsProps = {
  gameId: string | bigint
  filter?: Condition_Filter
  orderBy?: Condition_OrderBy
  orderDir?: OrderDirection
  chainId?: ChainId
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export type UseConditions = (props: UseConditionsProps) => UseQueryResult<ConditionsQuery['conditions']>

export const useConditions: UseConditions = (props) => {
  const { gameId, filter = {}, orderBy, orderDir, chainId, query = {} } = props
  const { graphql } = useOptionalChain(chainId)

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
