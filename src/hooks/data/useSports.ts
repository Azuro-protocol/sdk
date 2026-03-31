import {
  type ChainId,
  GameState,
  OrderDirection,
  GameOrderBy,
  getSports,
  type SportData,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'


export type UseSportsQueryFnData = SportData[]

export type UseSportsProps<TData = UseSportsQueryFnData> = {
  filter?: {
    sportSlug?: string
    countrySlug?: string
    leagueSlug?: string
    sportIds?: Array<string | number>
    /**
     * default: 1000,
     * minimum: 10
     * */
    maxGamesPerLeague?: number
    /** @deprecated pass `maxGamesPerLeague` instead */
    limit?: number
  }
  gameOrderBy?: GameOrderBy
  orderDir?: OrderDirection
  /** if false or undefined, follows games sorting order */
  sortLeaguesAndCountriesByName?: boolean
  isLive?: boolean
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseSportsQueryFnData, TData>
}

export type GetUseSportsQueryOptionsProps<TData = UseSportsQueryFnData> = UseSportsProps<TData> & {
  chainId: ChainId
}

export type UseSports<TData = UseSportsQueryFnData> = (props?: UseSportsProps<TData>) => UseQueryResult<TData>

export const getUseSportsQueryOptions = <TData = UseSportsQueryFnData>(params: GetUseSportsQueryOptionsProps<TData>) => {
  const {
    filter = {},
    gameOrderBy = GameOrderBy.StartsAt,
    orderDir = OrderDirection.Asc,
    sortLeaguesAndCountriesByName,
    isLive,
    chainId,
    query,
  } = params

  const maxGamesPerLeague = filter.maxGamesPerLeague ?? filter.limit ?? 1000

  return queryOptions({
    queryKey: [
      'sports',
      isLive,
      chainId,
      gameOrderBy,
      orderDir,
      maxGamesPerLeague,
      // filter.sportHub,
      filter.sportSlug,
      filter.countrySlug,
      filter.leagueSlug,
      filter.sportIds?.join('-'),
      sortLeaguesAndCountriesByName,
    ],
    queryFn: async () => {
      const data = await getSports({
        chainId,
        gameState: isLive ? GameState.Live : GameState.Prematch,
        sportIds: filter.sportIds,
        sportSlug: filter.sportSlug,
        countrySlug: filter.countrySlug,
        numberOfGames: maxGamesPerLeague,
        leagueSlug: filter.leagueSlug,
        orderBy: gameOrderBy,
        orderDir,
      })

      const sports = data.map((sport) => {
        const countries = sport.countries.map(country => {
          const leagues = country.leagues.slice().sort((a, b) => {
            const value = +a.games[0]!.startsAt - +b.games[0]!.startsAt

            if (sortLeaguesAndCountriesByName || value === 0) {
              return a.name.localeCompare(b.name)
            }

            return value
          })

          return {
            ...country,
            leagues,
          }
        })

        return {
          ...sport,
          countries: countries.sort((a, b) => {
            const value = +a.leagues[0]!.games[0]!.startsAt - +b.leagues[0]!.games[0]!.startsAt

            if (sortLeaguesAndCountriesByName || value === 0) {
              return a.name.localeCompare(b.name)
            }

            return value
          }),
        }
      })

      return sports.sort((a, b) => {
        const value = +a.countries[0]!.leagues[0]!.games[0]!.startsAt - +b.countries[0]!.leagues[0]!.games[0]!.startsAt

        if (value === 0) {
          return a.name.localeCompare(b.name)
        }

        return value
      })
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

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
export const useSports = <TData = UseSportsQueryFnData>(props: UseSportsProps<TData> = {}) => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(getUseSportsQueryOptions({ ...props, chainId: chain.id }))
}
