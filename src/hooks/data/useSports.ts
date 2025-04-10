import {
  type SportsQuery,
  type SportsQueryVariables,

  GameState,
  Game_OrderBy,
  OrderDirection,
  SportsDocument,
} from '@azuro-org/toolkit'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useChain } from '../../contexts/chain'
import { type SportHub, type QueryParameter } from '../../global'
import { gqlRequest } from '../../helpers/gqlRequest'


export type UseSportsProps = {
  filter?: {
    limit?: number
    sportHub?: SportHub
    sportSlug?: string
    countrySlug?: string
    leagueSlug?: string
    sportIds?: Array<string | number>
  }
  gameOrderBy?: Game_OrderBy.Turnover | Game_OrderBy.StartsAt
  orderDir?: OrderDirection
  isLive?: boolean
  query?: QueryParameter<SportsQuery['sports']>
}

export const useSports = (props: UseSportsProps = {}) => {
  const {
    filter = {},
    gameOrderBy = Game_OrderBy.StartsAt,
    orderDir = OrderDirection.Asc,
    isLive,
    query = {},
  } = props

  const { graphql } = useChain()

  const gqlLink = graphql.feed

  const formatData = useCallback((data: SportsQuery['sports']) => {
    const filteredSports = data.map(sport => {
      const { countries } = sport

      const filteredCountries = countries.filter(({ leagues }) => leagues.length)

      return {
        ...sport,
        countries: filteredCountries,
      }
    }).filter(sport => sport.countries.length)

    if (gameOrderBy === Game_OrderBy.Turnover) {

      return filteredSports.sort((a, b) => +b.turnover - +a.turnover)
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
  }, [])

  return useQuery({
    queryKey: [
      'sports',
      isLive,
      gqlLink,
      gameOrderBy,
      orderDir,
      filter.limit,
      filter.sportHub,
      filter.sportSlug,
      filter.countrySlug,
      filter.leagueSlug,
      filter.sportIds?.join('-'),
    ],
    queryFn: async () => {
      const variables: SportsQueryVariables = {
        first: filter.limit ?? 1000,
        sportFilter: {},
        countryFilter: {},
        leagueFilter: {},
        gameFilter: {
          state: isLive ? GameState.Live : GameState.Prematch,
        },
        gameOrderBy,
        gameOrderDirection: orderDir,
      }

      if (isLive) {
        variables.sportFilter!.activeLiveGamesCount_not = 0
        variables.countryFilter!.activeLiveGamesCount_not = 0
        variables.leagueFilter!.activeLiveGamesCount_not = 0
      }
      else {
        variables.sportFilter!.activePrematchGamesCount_not = 0
        variables.countryFilter!.activePrematchGamesCount_not = 0
        variables.leagueFilter!.activePrematchGamesCount_not = 0
      }

      if (filter.sportSlug) {
        variables.sportFilter!.slug = filter.sportSlug
      }

      if (filter.sportHub) {
        variables.sportFilter!.sporthub = filter.sportHub
      }

      if (filter.sportIds?.length) {
        variables.sportFilter!.sportId_in = filter.sportIds
      }

      if (filter.countrySlug) {
        variables.countryFilter!.slug = filter.countrySlug
      }

      if (filter.leagueSlug) {
        variables.leagueFilter!.slug = filter.leagueSlug
      }

      const { sports } = await gqlRequest<SportsQuery, SportsQueryVariables>({
        url: gqlLink,
        document: SportsDocument,
        variables,
      })

      return sports
    },
    select: formatData,
    refetchOnWindowFocus: false,
    ...query,
  })
}
