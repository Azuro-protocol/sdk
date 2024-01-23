import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { GamesDocument, GamesQuery, GamesQueryVariables } from '../docs/prematch/games'
import { useApolloClients } from '../contexts/apollo';
import { useLive } from '../contexts/live';
import { GameStatus, Game_OrderBy, OrderDirection } from '../docs/prematch/types'
import { getGameStartsAtGtValue } from '../helpers'


type UseGamesProps = {
  filter?: {
    limit?: number
    offset?: number
    sportSlug?: string
  }
  orderBy?: Game_OrderBy
  orderDir?: OrderDirection
  withConditions?: boolean
}

export const useGames = (props?: UseGamesProps) => {
  const {
    filter,
    orderBy = Game_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Desc,
    withConditions = false,
  } = props || {}

  const { prematchClient, liveClient } = useApolloClients()
  const { isLive } = useLive()

  const startsAt_gt = getGameStartsAtGtValue()

  const options = useMemo<QueryHookOptions<GamesQuery, GamesQueryVariables>>(() => {
    const variables: GamesQueryVariables = {
      orderBy,
      orderDirection: orderDir,
      where: {
        hasActiveConditions: true,
        status_in: [ GameStatus.Created, GameStatus.Paused ],
      },
    }

    if (isLive) {
      variables.where.startsAt_lt = startsAt_gt
    }
    else {
      variables.where.startsAt_gt = startsAt_gt
    }

    if (filter?.limit) {
      variables.first = filter.limit
    }

    if (filter?.offset) {
      variables.skip = filter.offset
    }

    if (filter?.sportSlug) {
      variables.where.sport_ = {
        slug_starts_with_nocase: filter.sportSlug,
      }
    }

    return {
      variables,
      ssr: false,
      client: isLive ? liveClient! : prematchClient!,
    }
  }, [
    filter?.limit,
    filter?.offset,
    filter?.sportSlug,
    orderBy,
    orderDir,
    startsAt_gt,
    withConditions,
    isLive,
  ])

  return useQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options)
}
