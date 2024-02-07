import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'

import { useChain } from 'src/contexts/chain'

import { useApolloClients } from '../contexts/apollo'
import { useLive } from '../contexts/live'
import { SportsDocument, type SportsQuery, type SportsQueryVariables } from '../docs/prematch/sports'
import {
  GameStatus,
  Game_OrderBy,
  OrderDirection,
} from '../docs/prematch/types'
import { getGameStartsAtValue } from '../helpers'


export type UseSportsProps = {
  filter?: {
    limit?: number
    sportSlug?: string
    countrySlug?: string
    leagueSlug?: string
  }
  gameOrderBy?: Game_OrderBy
  orderDir?: OrderDirection
}

export const useSports = (props: UseSportsProps) => {
  const {
    filter,
    gameOrderBy = Game_OrderBy.StartsAt,
    orderDir = OrderDirection.Desc,
  } = props || {}

  const { prematchClient, liveClient } = useApolloClients()
  const { isLive } = useLive()
  const { contracts } = useChain()


  const startsAt = getGameStartsAtValue()

  const options = useMemo<QueryHookOptions<SportsQuery, SportsQueryVariables>>(() => {
    const variables: SportsQueryVariables = {
      first: filter?.limit || 1000,
      sportFilter: {},
      countryFilter: {},
      leagueFilter: {},
      gameFilter: {
        hasActiveConditions: true,
        status_in: [ GameStatus.Created, GameStatus.Paused ],
      },
      gameOrderBy,
      gameOrderDirection: orderDir,
    }

    if (filter?.sportSlug) {
      variables.sportFilter!.slug = filter.sportSlug
    }

    if (filter?.countrySlug) {
      variables.countryFilter!.slug = filter.countrySlug
    }

    if (isLive) {
      variables.gameFilter!.startsAt_lt = startsAt
    }
    else {
      variables.gameFilter!.startsAt = startsAt
      variables.gameFilter!.liquidityPool = contracts.lp.address
    }

    variables.leagueFilter!.games_ = variables.gameFilter!

    if (filter?.leagueSlug) {
      variables.leagueFilter!.slug = filter.leagueSlug
    }

    return {
      variables,
      ssr: false,
      client: isLive ? liveClient! : prematchClient!,
      notifyOnNetworkStatusChange: true,
    }
  }, [
    isLive,
    gameOrderBy,
    orderDir,
    filter?.limit,
    filter?.sportSlug,
    filter?.countrySlug,
    filter?.leagueSlug,
    startsAt,
  ])

  return useQuery<SportsQuery, SportsQueryVariables>(SportsDocument, options)
}
