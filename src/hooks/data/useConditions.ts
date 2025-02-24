import {
  type Condition_Filter,

  type PrematchConditionsQuery,
  type PrematchConditionsQueryVariables,
  PrematchConditionsDocument,

  type LiveConditionsQuery,
  type LiveConditionsQueryVariables,
  LiveConditionsDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { useChain } from '../../contexts/chain'


type QueryProps = {
  refetchInterval?: number
  enabled?: boolean
}

type UseConditionsProps = {
  gameId: string | bigint
  filter?: Condition_Filter
  prematchQueryProps?: QueryProps
  liveQueryProps?: QueryProps
}

const defaultQueryProps: QueryProps = {
  refetchInterval: undefined,
  enabled: true,
}

export const useConditions = (props: UseConditionsProps) => {
  const { gameId, filter, prematchQueryProps = defaultQueryProps, liveQueryProps = defaultQueryProps } = props
  const { appChain, contracts, graphql } = useChain()

  const prematchQuery = useQuery({
    queryKey: [
      'prematch-conditions',
      appChain.id,
      gameId,
      filter,
    ],
    queryFn: async () => {
      const variables: PrematchConditionsQueryVariables = {
        where: {
          ...(filter || {}),
          game_: {
            gameId,
          },
        },
      }

      const { conditions } = await request<PrematchConditionsQuery, PrematchConditionsQueryVariables>({
        url: graphql.prematch,
        document: PrematchConditionsDocument,
        variables,
      })

      return conditions
    },
    enabled: Boolean(gameId) && (prematchQueryProps.enabled ?? true),
    refetchInterval: prematchQueryProps?.refetchInterval,
  })

  const liveQuery = useQuery({
    queryKey: [
      'live-conditions',
      appChain.id,
      gameId,
      filter,
    ],
    queryFn: async () => {
      const variables: LiveConditionsQueryVariables = {
        where: {
          ...(filter as any || {}),
          game_: {
            gameId,
          },
        },
      }

      const { conditions } = await request<LiveConditionsQuery, LiveConditionsQueryVariables>({
        url: graphql.prematch,
        document: LiveConditionsDocument,
        variables,
      })

      return conditions
    },
    enabled: Boolean(gameId) && (liveQueryProps.enabled ?? true),
    refetchInterval: liveQueryProps?.refetchInterval,
  })

  return {
    prematchQuery,
    liveQuery,
  }
}
