import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { GamesDocument, GamesQueryResult, GamesQueryVariables } from '../docs/games'
import { Game_Filter, Game_OrderBy, OrderDirection } from '../types'


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

  const options = useMemo(() => {
    const sport_: Game_Filter['sport_'] = {}

    if (filter?.sportName) {
      sport_.name_starts_with_nocase = filter.sportName
    }

    const variables: GamesQueryVariables = {
      first: filter?.limit,
      skip: filter?.offset,
      orderBy,
      orderDirection: orderDir,
      withConditions,
      where: {
        sport_,
        startsAt_gt,
        hasActiveConditions: true,
      },
    }

    return {
      variables,
      ssr: false,
    }
  }, [
    filter?.limit,
    filter?.offset,
    filter?.sportName,
    orderBy,
    orderDir,
    startsAt_gt,
    withConditions,
  ])

  return useQuery<GamesQueryResult, GamesQueryVariables>(GamesDocument, options)
}
