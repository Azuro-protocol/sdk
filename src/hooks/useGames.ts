import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'

import type { GamesQuery, GamesQueryVariables } from '../docs/prematch/games'
import { GamesDocument } from '../docs/prematch/games'
import { useApolloClients } from '../contexts/apollo'
import { useLive } from '../contexts/live'
import { GameStatus, Game_OrderBy, OrderDirection } from '../docs/prematch/types'
import { getGameStartsAtValue } from '../helpers'
import type { SportHub } from '../global'


export type UseGamesProps = {
  filter?: {
    limit?: number
    offset?: number
    sportHub?: SportHub
    sportSlug?: string
    leagueSlug?: string
  }
  orderBy?: Game_OrderBy
  orderDir?: OrderDirection
}

export const useGames = (props?: UseGamesProps) => {
  const {
    filter,
    orderBy = Game_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Desc,
  } = props || {}

  const { prematchClient, liveClient } = useApolloClients()
  const { isLive } = useLive()

  const startsAt = getGameStartsAtValue()

  const options = useMemo<QueryHookOptions<GamesQuery, GamesQueryVariables>>(() => {
    const variables: GamesQueryVariables = {
      first: 1000,
      orderBy,
      orderDirection: orderDir,
      where: {
        hasActiveConditions: true,
        status_in: [ GameStatus.Created, GameStatus.Paused ],
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
