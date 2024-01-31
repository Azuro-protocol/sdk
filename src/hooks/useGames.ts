import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { GamesDocument, GamesQuery, GamesQueryVariables } from '../docs/games'
import { Game_OrderBy, OrderDirection, GameStatus } from '../types'
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

  const startsAt_gt = getGameStartsAtGtValue()

  const options = useMemo<QueryHookOptions<GamesQuery, GamesQueryVariables>>(() => {
    const variables: GamesQueryVariables = {
      first: 1000,
      orderBy,
      orderDirection: orderDir,
      where: {
        startsAt_gt,
        hasActiveConditions: true,
        status_in: [ GameStatus.Created, GameStatus.Paused ],
      },
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
    }
  }, [
    filter?.limit,
    filter?.offset,
    filter?.sportSlug,
    orderBy,
    orderDir,
    startsAt_gt,
    withConditions,
  ])

  return useQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options)
}
