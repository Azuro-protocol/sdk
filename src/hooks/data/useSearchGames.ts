import { useState, useEffect } from 'react'
import {
  type ChainId,
  searchGames,
  type SearchGamesResult,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'


export type UseSearchGamesQueryFnData = SearchGamesResult

export type UseSearchGamesProps<TData = UseSearchGamesQueryFnData> = {
  input: string
  chainId?: ChainId
  /** page number (1-based), default: 1 */
  page?: number
  /** items per page, default: 10 */
  perPage?: number
  debounceMs?: number
  query?: QueryParameterWithSelect<UseSearchGamesQueryFnData, TData>
}

export type GetUseSearchGamesQueryOptionsProps<TData = UseSearchGamesQueryFnData> =  UseSearchGamesProps<TData> & {
  chainId: ChainId
}

export const getUseSearchGamesQueryOptions = <TData = UseSearchGamesQueryFnData>(params: GetUseSearchGamesQueryOptionsProps<TData>) => {
  const { input, chainId, page, perPage, query = {} } = params

  const isQueryValid = input?.length >= 3
  const enabled = Boolean(isQueryValid && (typeof query?.enabled === 'boolean' ? query.enabled : true))

  return queryOptions({
    queryKey: [ 'searchGames', chainId, input, page, perPage ] as const,
    queryFn: async () => searchGames({
      chainId,
      query: input,
      page,
      perPage,
    }),
    refetchOnWindowFocus: false,
    ...query,
    enabled,
  })
}

export type UseSearchGames = <TData = UseSearchGamesQueryFnData>(props: UseSearchGamesProps<TData>) => UseQueryResult<TData>

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
export const useSearchGames = <TData = UseSearchGamesQueryFnData>(props: UseSearchGamesProps<TData>) => {
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

  return useQuery(
    getUseSearchGamesQueryOptions({
      input: debouncedQuery,
      chainId: chain.id,
      page,
      perPage,
      query,
    })
  )
}
