import {
  type ConditionState,
  type GamesQuery,
  type GamesQueryVariables,

  GameState,
  Game_OrderBy,
  OrderDirection,
  GamesDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'

import { useChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


export type UseGamesProps = {
  filter?: {
    limit?: number
    offset?: number
    sportHub?: AzuroSDK.SportHub
    sportSlug?: string
    sportIds?: Array<string | number>
    leagueSlug?: string | string[]
    conditionsState?: ConditionState | ConditionState[]
  }
  orderBy?: Game_OrderBy
  orderDir?: OrderDirection
  isLive?: boolean
  query?: QueryParameter<GamesQuery['games']>
}

export const useGames = (props: UseGamesProps = {}) => {
  const {
    filter = {},
    orderBy = Game_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Desc,
    isLive,
    query = {},
  } = props

  const { graphql } = useChain()

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
          activeConditionsCount_not: 0,
          state: isLive ? GameState.Live : GameState.Prematch,
          conditions_: {},
          sport_: {},
          league_: {},
        },
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
