import {
  type ConditionState,
  type GamesQuery,
  type GamesQueryVariables,
  type ChainId,

  GameState,
  Game_OrderBy,
  OrderDirection,
  GamesDocument,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type SportHub, type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


export type UseGamesProps = {
  filter?: {
    limit?: number
    offset?: number
    sportHub?: SportHub
    sportSlug?: string
    sportIds?: Array<string | number>
    leagueSlug?: string | string[]
    maxMargin?: number | string
    conditionsState?: ConditionState | ConditionState[]
  }
  orderBy?: Game_OrderBy
  orderDir?: OrderDirection
  isLive?: boolean
  chainId?: ChainId
  query?: QueryParameter<GamesQuery['games']>
}

export type UseGames = (props?: UseGamesProps) => UseQueryResult<GamesQuery['games']>

export const useGames: UseGames = (props = {}) => {
  const {
    filter = {},
    orderBy = Game_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Desc,
    isLive,
    chainId,
    query = {},
  } = props

  const { graphql } = useOptionalChain(chainId)

  const gqlLink = graphql.feed

  return useQuery({
    queryKey: [
      'games',
      gqlLink,
      isLive,
      filter.limit,
      filter.offset,
      filter.sportHub,
      filter.sportSlug,
      filter.sportIds?.join('-'),
      filter.leagueSlug,
      filter.maxMargin,
      filter.conditionsState,
      orderBy,
      orderDir,
    ],
    queryFn: async () => {
      const variables: GamesQueryVariables = {
        first: 1000,
        orderBy,
        orderDirection: orderDir,
        where: {
          state: isLive ? GameState.Live : GameState.Prematch,
          activeAndStoppedConditionsCount_not: 0,
          conditions_: {},
          sport_: {},
          league_: {},
        },
      }

      if (isLive) {
        variables.where.activeAndStoppedConditionsCount_not = 0
      }
      else {

        variables.where.activeConditionsCount_not = 0
      }

      if (filter.limit) {
        variables.first = filter.limit
      }

      if (filter.offset) {
        variables.skip = filter.offset
      }

      if (filter.sportHub) {
        variables.where.sport_!.sporthub = filter.sportHub
      }

      if (filter.sportSlug) {
        variables.where.sport_!.slug_starts_with_nocase = filter.sportSlug
      }

      if (filter.sportIds?.length) {
        variables.where.sport_!.sportId_in = filter?.sportIds
      }

      if (filter.leagueSlug) {
        variables.where.league_!.slug_in = typeof filter.leagueSlug === 'string' ? [ filter.leagueSlug ] : filter.leagueSlug
      }

      if (filter.maxMargin) {
        variables.where.conditions_!.margin_lte = String(filter.maxMargin)
      }

      if (filter.conditionsState) {
        if (typeof filter.conditionsState === 'string') {
          variables.where.conditions_!.state = filter.conditionsState
        }
        else {
          variables.where.conditions_!.state_in = filter.conditionsState
        }
      }

      const { games } = await gqlRequest<GamesQuery, GamesQueryVariables>({
        url: gqlLink,
        document: GamesDocument,
        variables,
      })

      return games
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}
