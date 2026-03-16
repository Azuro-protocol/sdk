import {
  type ChainId,
  getNavigation,
  type NavigationSportData,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { type SportHub, type QueryParameter } from '../../global'
import { useOptionalChain } from '../../contexts/chain'


export type UseNavigationProps<ReturnMapValue extends boolean> = {
  filter?: {
    sportHub?: SportHub
    sportIds?: Array<string | number>
  }
  isLive?: boolean
  returnAsPrematchAndLiveMap?: ReturnMapValue
  chainId?: ChainId
  query?: QueryParameter<ReturnMapValue extends true ? Record<'prematch' | 'live', NavigationSportData[]> : NavigationSportData[]>
}

export type UseNavigation = typeof useNavigation

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
export const useNavigation = <ReturnMapValue extends boolean>(props: UseNavigationProps<ReturnMapValue> = {}) => {
  const { filter = {}, returnAsPrematchAndLiveMap = false, isLive, chainId, query = {} } = props

  const { chain, api } = useOptionalChain(chainId)

  return useQuery({
    queryKey: [
      'navigation',
      api,
      isLive,
      filter.sportHub,
      filter.sportIds?.join('-'),
      returnAsPrematchAndLiveMap,
    ],
    queryFn: async (): Promise<ReturnMapValue extends true ? Record<'prematch' | 'live' | 'all', NavigationSportData[]> : NavigationSportData[]> => {
      const sports = await getNavigation({
        chainId: chain.id,
        sportIds: filter.sportIds,
        sportHub: filter.sportHub,
      })

      const result = sports.reduce<Record<'prematch' | 'live' | 'all', NavigationSportData[]>>((acc, sport) => {
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
        return result as ReturnMapValue extends true ? Record<'prematch' | 'live' | 'all', NavigationSportData[]> : NavigationSportData[]
      }

      return (isLive ? result.live : result.prematch) as ReturnMapValue extends true ? Record<'prematch' | 'live' | 'all', NavigationSportData[]> : NavigationSportData[]
    },
    refetchOnWindowFocus: false,
    ...query,
  }) as UseQueryResult<ReturnMapValue extends true ? Record<'prematch' | 'live' | 'all', NavigationSportData[]> : NavigationSportData[]>
}
