import { useState, useEffect } from 'react'
import {
  type ChainId,
  searchGames,
  type SearchGamesResult,
} from '@azuro-org/toolkit'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameter } from '../../global'


export type UseSearchGamesProps = {
  input: string
  chainId?: ChainId
  /** page number (1-based), default: 1 */
  page?: number
  /** items per page, default: 10 */
  perPage?: number
  debounceMs?: number
  query?: QueryParameter<SearchGamesResult>
}

export type UseSearchGames = (props: UseSearchGamesProps) => UseQueryResult<SearchGamesResult>

/**
 * Search active prematch and live games by text.
 * Searching for game participants / leagues / countries.
 *
 * `input` value is debounced by `debounceMs` prop (default: 300ms) and trimmed (`.trim()`).
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useSearchGames
 *
 * @example
 * import { useSearchGames } from '@azuro-org/sdk'
 *
 * const { data, isFetching } = useSearchGames({ input: 'Man' })
 * const { games, page, perPage, total, totalPages } = data || {}
 * */
export const useSearchGames: UseSearchGames = (props) => {
  const {
    input: searchQuery,
    chainId,
    page,
    perPage,
    query = {},
  } = props

  const debounceMs = isFinite(Number(props.debounceMs)) ? Math.max(props.debounceMs!, 300) : 300

  const { chain } = useOptionalChain(chainId)
  const [ debouncedQuery, setDebouncedQuery ] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery?.trim())
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [ searchQuery, debounceMs ])

  const isQueryValid = debouncedQuery?.length >= 3

  return useQuery({
    queryKey: [
      'searchGames',
      chain.id,
      debouncedQuery,
      page,
      perPage,
    ],
    queryFn: async () => searchGames({
      chainId: chain.id,
      query: debouncedQuery,
      page,
      perPage,
    }),
    refetchOnWindowFocus: false,
    ...query,
    enabled: Boolean(isQueryValid && (typeof query?.enabled === 'boolean' ? query.enabled : true)),
  })
}
