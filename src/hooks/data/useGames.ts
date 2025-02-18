import { parseUnits } from 'viem'
import {
  PrematchGraphGameStatus,
  Game_OrderBy,
  OrderDirection,
  GamesDocument,
  MARGIN_DECIMALS,

  type ConditionStatus,
  type GamesQuery,
  type GamesQueryVariables,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { useChain } from '../../contexts/chain'
import { getGameStartsAtValue } from '../../helpers'
import { type SportHub } from '../../global'


export type UseGamesProps = {
  filter?: {
    limit?: number
    offset?: number
    sportHub?: SportHub
    sportSlug?: string
    sportIds?: Array<string | number>
    leagueSlug?: string | string[]
    maxMargin?: number
    conditionsStatus?: ConditionStatus | ConditionStatus[]
  }
  orderBy?: Game_OrderBy
  orderDir?: OrderDirection
  isLive?: boolean
}

export const useGames = (props?: UseGamesProps) => {
  const {
    filter,
    orderBy = Game_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Desc,
    isLive,
  } = props || {}
  const { graphql } = useChain()

  const startsAt = getGameStartsAtValue()
  const gqlLink = isLive ? graphql.live : graphql.prematch

  return useQuery({
    queryKey: [
      'games',
      gqlLink,
      filter?.limit,
      filter?.offset,
      filter?.sportHub,
      filter?.sportSlug,
      filter?.sportIds?.join('-'),
      filter?.leagueSlug,
      filter?.maxMargin,
      filter?.conditionsStatus,
      orderBy,
      orderDir,
      startsAt,
    ],
    queryFn: async () => {
      const variables: GamesQueryVariables = {
        first: 1000,
        orderBy,
        orderDirection: orderDir,
        where: {
          hasActiveConditions: true,
          status_in: [ PrematchGraphGameStatus.Created, PrematchGraphGameStatus.Paused ],
          conditions_: {},
          sport_: {},
          league_: {},
        },
      }

      if (isLive) {
        variables.where.startsAt_lt = startsAt
      }
      else {
        variables.where.startsAt_gt = startsAt
      }

      if (filter?.limit) {
        variables.first = filter.limit
      }

      if (filter?.offset) {
        variables.skip = filter.offset
      }

      if (filter?.sportHub) {
        variables.where.sport_!.sporthub = filter.sportHub
      }

      if (filter?.sportSlug) {
        variables.where.sport_!.slug_starts_with_nocase = filter.sportSlug
      }

      if (filter?.sportIds?.length) {
        variables.where.sport_!.sportId_in = filter?.sportIds
      }

      if (filter?.leagueSlug) {
        variables.where.league_!.slug_in = typeof filter.leagueSlug === 'string' ? [ filter.leagueSlug ] : filter.leagueSlug
      }

      if (filter?.maxMargin) {
        variables.where.conditions_!.margin_lte = parseUnits(String(filter.maxMargin), MARGIN_DECIMALS).toString()
      }

      if (filter?.conditionsStatus) {
        if (typeof filter.conditionsStatus === 'string') {
          variables.where.conditions_!.status = filter.conditionsStatus
        }
        else {
          variables.where.conditions_!.status_in = filter.conditionsStatus
        }
      }

      const { games } = await request<GamesQuery, GamesQueryVariables>({
        url: gqlLink,
        document: GamesDocument,
        variables,
      })

      return games
    },
  })
}
