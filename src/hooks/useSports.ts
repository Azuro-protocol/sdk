import { useMemo } from 'react'
import { useQuery, type QueryHookOptions } from '@apollo/client'

import { useChain } from '../contexts/chain'
import { useApolloClients } from '../contexts/apollo'
import { useLive } from '../contexts/live'
import { SportsDocument, type SportsQuery, type SportsQueryVariables } from '../docs/prematch/sports'
import {
  GameStatus,
  Game_OrderBy,
  OrderDirection,
} from '../docs/prematch/types'
import { getGameStartsAtValue } from '../helpers'
import type { SportHub } from '../global'


export type UseSportsProps = {
  filter?: {
    limit?: number
    sportHub?: SportHub
    sportSlug?: string
    countrySlug?: string
    leagueSlug?: string
  }
  gameOrderBy?: Game_OrderBy.Turnover | Game_OrderBy.StartsAt
  orderDir?: OrderDirection
}

export const useSports = (props: UseSportsProps) => {
  const {
    filter,
    gameOrderBy = Game_OrderBy.StartsAt,
    orderDir = OrderDirection.Asc,
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

    if (filter?.sportHub) {
      variables.sportFilter!.sporthub = filter.sportHub
    }

    if (filter?.countrySlug) {
      variables.countryFilter!.slug = filter.countrySlug
    }

    if (isLive) {
      variables.gameFilter!.startsAt_lt = startsAt
    }
    else {
      variables.gameFilter!.startsAt_gt = startsAt
      variables.gameFilter!.liquidityPool = contracts.lp.address.toLowerCase()
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
    contracts.lp.address,
    gameOrderBy,
    orderDir,
    filter?.limit,
    filter?.sportHub,
    filter?.sportSlug,
    filter?.countrySlug,
    filter?.leagueSlug,
    startsAt,
  ])

  const { data, loading, error } = useQuery<SportsQuery, SportsQueryVariables>(SportsDocument, options)

  const { sports } = data || { sports: [] }

  const formattedSports = useMemo(() => {
    if (!sports.length) {
      return []
    }

    const filteredSports = sports.map(sport => {
      const { countries } = sport

      const filteredCountries = countries.filter(({ leagues }) => leagues.length)

      return {
        ...sport,
        countries: filteredCountries,
      }
    }).filter(sport => sport.countries.length)

    if (gameOrderBy === Game_OrderBy.Turnover) {
      const sportsWithTurnover = filteredSports.map(sport => {
        const { countries } = sport

        const turnover = countries.reduce((acc, { turnover }) => {
          acc += +turnover

          return acc
        }, 0)

        return {
          ...sport,
          turnover,
        }
      })

      return sportsWithTurnover.sort((a, b) => b.turnover - a.turnover)
    }

    if (gameOrderBy === Game_OrderBy.StartsAt) {
      return filteredSports.map(sport => {
        const { countries } = sport

        const sortedCountries = countries.map(country => {
          const { leagues } = country

          return {
            ...country,
            leagues: [ ...leagues ].sort((a, b) => +a.games[0]!.startsAt - +b.games[0]!.startsAt),
          }
        }).sort((a, b) => +a.leagues[0]!.games[0]!.startsAt - +b.leagues[0]!.games[0]!.startsAt)

        return {
          ...sport,
          countries: sortedCountries,
        }
      }).sort((a, b) => +a.countries[0]!.leagues[0]!.games[0]!.startsAt - +b.countries[0]!.leagues[0]!.games[0]!.startsAt)
    }

    return filteredSports
  }, [ sports ])

  return {
    loading,
    sports: formattedSports,
    error,
  }
}
