import {
  type Condition_Filter,
  type ConditionsQuery,
  type ConditionsQueryVariables,
  ConditionsDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


type UseConditionsProps = {
  gameId: string | bigint
  filter?: Condition_Filter
  query?: QueryParameter<ConditionsQuery['conditions']>
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameId, filter = {}, query = {} } = props
  const { appChain, graphql } = useChain()

  return useQuery({
    queryKey: [
      'conditions',
      appChain.id,
      gameId,
      filter,
    ],
    queryFn: async () => {
      const variables: ConditionsQueryVariables = {
        where: {
          ...filter,
          game_: {
            gameId,
          },
        },
      }

      const { conditions } = await request<ConditionsQuery, ConditionsQueryVariables>({
        url: graphql.feed,
        document: ConditionsDocument,
        variables,
      })

      return conditions
    },
    refetchOnWindowFocus: false,
    ...query,
  })

  // const liveQuery = useQuery({
  //   queryKey: [
  //     'live-conditions',
  //     appChain.id,
  //     gameId,
  //     filter,
  //   ],
  //   queryFn: async () => {
  //     const variables: LiveConditionsQueryVariables = {
  //       where: {
  //         ...(filter as any || {}),
  //         game_: {
  //           gameId,
  //         },
  //       },
  //     }

  //     const { conditions } = await request<LiveConditionsQuery, LiveConditionsQueryVariables>({
  //       url: graphql.prematch,
  //       document: LiveConditionsDocument,
  //       variables,
  //     })

  //     return conditions
  //   },
  //   enabled: Boolean(gameId) && (liveQueryProps.enabled ?? true),
  //   refetchInterval: liveQueryProps?.refetchInterval,
  // })

  // return {
  //   prematchQuery,
  //   liveQuery,
  // }
}
