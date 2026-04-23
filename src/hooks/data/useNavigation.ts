import {
  type ChainId,
  chainsData,
  getNavigation,
  type NavigationSportData,
} from '@azuro-org/toolkit'
import { queryOptions, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { type SportHub, type QueryParameterWithSelect } from '../../global'
import { useOptionalChain } from '../../contexts/chain'

export type UseNavigationQueryFnData<ReturnMapValue extends boolean = false> = ReturnMapValue extends true
  ? Record<'prematch' | 'live' | 'all', NavigationSportData[]>
  : NavigationSportData[]

export type UseNavigationProps<ReturnMapValue extends boolean = false, TData = UseNavigationQueryFnData<ReturnMapValue>> = {
  filter?: {
    sportHub?: SportHub
    sportIds?: Array<string | number>
  }
  isLive?: boolean
  returnAsPrematchAndLiveMap?: ReturnMapValue
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseNavigationQueryFnData<ReturnMapValue>, TData>
}

export type UseNavigation = typeof useNavigation

export type GetUseNavigationQueryOptionsProps<ReturnMapValue extends boolean = false, TData = UseNavigationQueryFnData<ReturnMapValue>> = UseNavigationProps<ReturnMapValue, TData> & {
  chainId: ChainId
}

export const getUseNavigationQueryOptions = <ReturnMapValue extends boolean = false, TData = UseNavigationQueryFnData<ReturnMapValue>>(params: GetUseNavigationQueryOptionsProps<ReturnMapValue, TData>) => {
  const { filter = {}, returnAsPrematchAndLiveMap = false, isLive, chainId, query } = params

  const api = chainsData[chainId].api

  return queryOptions({
    queryKey: [
      'navigation',
      api,
      isLive,
      filter.sportHub,
      filter.sportIds,
      returnAsPrematchAndLiveMap,
    ],
    queryFn: async (): Promise<UseNavigationQueryFnData<ReturnMapValue>> => {
      const sports = await getNavigation({
        chainId,
        sportIds: filter.sportIds,
        sportHub: filter.sportHub,
      })

      const result = sports.reduce<UseNavigationQueryFnData<true>>((acc, sport) => {
        const liveCountries: NavigationSportData['countries'] = []
        const prematchCountries: NavigationSportData['countries'] = []

        sport.countries.forEach(country => {
          const liveLeagues: NavigationSportData['countries'][0]['leagues'] = []
          const prematchLeagues: NavigationSportData['countries'][0]['leagues'] = []

          country.leagues.forEach(league => {
            if (league.activeLiveGamesCount) {
              liveLeagues.push(league)
            }
            if (league.activePrematchGamesCount) {
              prematchLeagues.push(league)
            }
          })

          if (liveLeagues.length) {
            liveCountries.push({ ...country, leagues: liveLeagues })
          }
          if (prematchLeagues.length) {
            prematchCountries.push({ ...country, leagues: prematchLeagues })
          }
        })

        if (liveCountries.length) {
          acc.live.push({ ...sport, countries: liveCountries })
        }

        if (prematchCountries.length) {
          acc.prematch.push({ ...sport, countries: prematchCountries })
        }

        return acc
      }, { live: [], prematch: [], all: [] })

      result.all = sports

      if (returnAsPrematchAndLiveMap) {
        return result as UseNavigationQueryFnData<ReturnMapValue>
      }

      return (
        isLive
          ? result.live
          : result.prematch
      ) as UseNavigationQueryFnData<ReturnMapValue>
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

/**
 * Get navigation data for sports, countries, and leagues with active games counts.
 * Can return data as a prematch/live/all map or filtered by `isLive` prop.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useNavigation
 *
 * @example
 * import { useNavigation } from '@azuro-org/sdk'
 *
 * const { data, isFetching } = useNavigation({ isLive: false })
 * */
export const useNavigation = <ReturnMapValue extends boolean = false, TData = UseNavigationQueryFnData<ReturnMapValue>>(props: UseNavigationProps<ReturnMapValue, TData> = {}) => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(
    getUseNavigationQueryOptions<ReturnMapValue, TData>({ ...props, chainId: chain.id })
  ) as UseQueryResult<TData>
}
