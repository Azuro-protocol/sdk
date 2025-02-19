import { useMemo } from 'react'
import {
  PrematchGraphGameStatus,
  Game_OrderBy,
  OrderDirection,

  type SportsQuery,
  type SportsQueryVariables,
  SportsDocument,
  type ChainId,
  chainsData,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions } from '@tanstack/react-query'
import { request } from 'graphql-request'

import { useChain } from '../../contexts/chain'
import { getGameStartsAtValue } from '../../helpers'
import type { SportHub } from '../../global'


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
}

const getSportsOptions = (props: UseSportsProps & { chainId: ChainId, startsAt?: number }) => {
  const {
    chainId,
    startsAt: _startsAt,
    filter,
    gameOrderBy = Game_OrderBy.StartsAt,
    orderDir = OrderDirection.Asc,
    isLive,
  } = props || {}

  const { graphql, contracts } = chainsData[chainId]

  const gqlLink = isLive ? graphql.live : graphql.prematch
  const startsAt = _startsAt || Math.floor(Date.now() / 1000)

  return queryOptions({
    queryKey: [
      'sports',
      gqlLink,
      gameOrderBy,
      orderDir,
      startsAt,
      filter?.limit,
      filter?.sportHub,
      filter?.sportSlug,
      filter?.countrySlug,
      filter?.leagueSlug,
      filter?.sportIds?.join('-'),
    ],
    queryFn: async () => {
      const variables: SportsQueryVariables = {
        first: filter?.limit || 1000,
        sportFilter: {},
        countryFilter: {},
        leagueFilter: {},
        gameFilter: {
          hasActiveConditions: true,
          status_in: [ PrematchGraphGameStatus.Created, PrematchGraphGameStatus.Paused ],
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

      if (filter?.sportIds?.length) {
        variables.sportFilter!.sportId_in = filter?.sportIds
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

      const { sports } = await request<SportsQuery, SportsQueryVariables>({
        url: gqlLink,
        document: SportsDocument,
        variables,
      })

      return sports
    },
  })
}

export const useSports = (props: UseSportsProps) => {
  const { gameOrderBy = Game_OrderBy.StartsAt } = props || {}

  const { appChain } = useChain()

  const startsAt = getGameStartsAtValue()

  const { data, ...rest } = useQuery(getSportsOptions({ ...props, chainId: appChain.id, startsAt }))

  const formattedSports = useMemo(() => {
    if (!data?.length) {
      return []
    }

    const filteredSports = data.map(sport => {
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
  }, [ data ])

  return {
    data: formattedSports,
    ...rest,
  }
}
