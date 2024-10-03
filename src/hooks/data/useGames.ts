import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
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

import { useApolloClients } from '../../contexts/apollo'
import { getGameStartsAtValue } from '../../helpers'
import type { SportHub } from '../../global'


export type UseGamesProps = {
  filter?: {
    limit?: number
    offset?: number
    sportHub?: SportHub
    sportSlug?: string
    leagueSlug?: string
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

  const { prematchClient, liveClient } = useApolloClients()

  const startsAt = getGameStartsAtValue()

  const options = useMemo<QueryHookOptions<GamesQuery, GamesQueryVariables>>(() => {
    const variables: GamesQueryVariables = {
      first: 1000,
      orderBy,
      orderDirection: orderDir,
      where: {
        hasActiveConditions: true,
        status_in: [ PrematchGraphGameStatus.Created, PrematchGraphGameStatus.Paused ],
        conditions_: {},
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
      variables.where.sport_ = {
        sporthub: filter.sportHub,
      }
    }

    if (filter?.sportSlug) {
      variables.where.sport_ = {
        slug_starts_with_nocase: filter.sportSlug,
      }
    }

    if (filter?.leagueSlug) {
      variables.where.league_ = {
        slug_ends_with_nocase: filter.leagueSlug,
      }
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

    return {
      variables,
      ssr: false,
      client: isLive ? liveClient! : prematchClient!,
      notifyOnNetworkStatusChange: true,
    }
  }, [
    filter?.limit,
    filter?.offset,
    filter?.sportSlug,
    filter?.sportHub,
    filter?.leagueSlug,
    filter?.maxMargin,
    filter?.conditionsStatus,
    orderBy,
    orderDir,
    startsAt,
    isLive,
  ])

  const { data, loading, error } = useQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options)

  return {
    games: data?.games,
    loading,
    error,
  }
}
