import {
  type ChainId,
  GameState,
  OrderDirection,
  GameOrderBy,
  getSports,
  type SportData,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


export type UseSportsProps = {
  filter?: {
    /** @deprecated pass `maxGamesPerLeague` instead */
    limit?: number
    /** default and minimum value in API is `10` */
    maxGamesPerLeague?: number
    sportSlug?: string
    countrySlug?: string
    leagueSlug?: string
    sportIds?: Array<string | number>
  }
  gameOrderBy?: GameOrderBy
  orderDir?: OrderDirection
  isLive?: boolean
  chainId?: ChainId
  query?: QueryParameter<SportData[]>
}

export type UseSports = (props?: UseSportsProps) => UseQueryResult<SportData[]>

/**
 * Fetches sports data with nested country and league information.
 * Automatically filters out empty sports/countries/leagues (those without games).
 *
 * Use `isLive` prop to switch between live and prematch sports.
 * Supports custom sorting by turnover or game start time.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useSports
 *
 * @example
 * import { useSports } from '@azuro-org/sdk'
 *
 * const { data: sports, isLoading } = useSports({
 *   filter: { sportHub: 'sports', maxGamesPerLeague: 20 },
 *   isLive: false
 * })
 * */
export const useSports: UseSports = (props = {}) => {
  const {
    filter = {},
    gameOrderBy = GameOrderBy.StartsAt,
    orderDir = OrderDirection.Asc,
    isLive,
    chainId,
    query = {},
  } = props

  const { chain } = useOptionalChain(chainId)
  const maxGamesPerLeague = filter.maxGamesPerLeague ?? filter.limit

  const formatData = useCallback((data: SportData[]) => {
    const filteredSports = data.map(sport => {
      const { countries } = sport

      const filteredCountries = countries.map((country) => {
        return {
          ...country,
          leagues: country.leagues.filter((league) => league.games.length),
        }
      }).filter((country) => country.leagues.length)

      return {
        ...sport,
        countries: filteredCountries,
      }
    }).filter(sport => sport.countries.length)

    if (gameOrderBy === GameOrderBy.Turnover) {
      return filteredSports.sort((a, b) => +b.turnover - +a.turnover)
    }

    if (gameOrderBy === GameOrderBy.StartsAt) {
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
  }, [])

  return useQuery({
    queryKey: [
      'sports',
      isLive,
      chain.id,
      gameOrderBy,
      orderDir,
      maxGamesPerLeague,
      // filter.sportHub,
      filter.sportSlug,
      filter.countrySlug,
      filter.leagueSlug,
      filter.sportIds?.join('-'),
    ],
    queryFn: async () => {
      return getSports({
        chainId: chain.id,
        gameState: isLive ? GameState.Live : GameState.Prematch,
        sportIds: filter.sportIds,
        sportSlug: filter.sportSlug,
        // sportHub: filter.sportHub,
        countrySlug: filter.countrySlug,
        numberOfGames: maxGamesPerLeague,
        leagueSlug: filter.leagueSlug,
        orderBy: gameOrderBy,
        orderDir,
      })
    },
    select: formatData,
    refetchOnWindowFocus: false,
    ...query,
  })
}
