import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'
import { GamesDocument, GamesQuery, GamesQueryVariables } from '../docs/games'
import { Game_OrderBy, OrderDirection } from '../types'


const DEFAULT_CACHE_TIME = 3 * 60
let lastUpdateTime: number

type UseGamesProps = {
  filter?: {
    limit?: number
    offset?: number
    sportName?: string
  }
  orderBy?: Game_OrderBy
  orderDir?: OrderDirection
  cacheTime?: number
  withConditions?: boolean
}

export const useGames = (props?: UseGamesProps) => {
  const {
    filter,
    orderBy = Game_OrderBy.CreatedBlockTimestamp,
    orderDir = OrderDirection.Desc,
    cacheTime = DEFAULT_CACHE_TIME,
    withConditions = false,
  } = props || {}

  let startsAt_gt: number
  const dateNow = Math.floor(Date.now() / 1000)

  // if first render or current time is greater the previous saved more than 1 minute
  if (!lastUpdateTime || dateNow - lastUpdateTime > cacheTime) {
    startsAt_gt = dateNow
    lastUpdateTime = dateNow
  }
  else {
    startsAt_gt = lastUpdateTime
  }

  const options = useMemo<QueryHookOptions<GamesQuery, GamesQueryVariables>>(() => ({
    variables: {
      first: filter?.limit,
      skip: filter?.offset,
      orderBy,
      orderDirection: orderDir,
      withConditions,
      where: {
        sport_: {
          name_starts_with_nocase: filter?.sportName,
        },
        startsAt_gt,
        hasActiveConditions: true,
      },
    },
    ssr: false,
  }), [
    filter?.limit,
    filter?.offset,
    filter?.sportName,
    orderBy,
    orderDir,
    startsAt_gt,
    withConditions,
  ])

  return useQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options)
}
