import { type ChainId, type GetPredefinedComboResult, getPredefinedCombo } from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'


export type UsePredefinedComboQueryFnData = GetPredefinedComboResult

export type UsePredefinedComboProps<TData = UsePredefinedComboQueryFnData> = {
  chainId?: ChainId
  query?: QueryParameterWithSelect<UsePredefinedComboQueryFnData, TData>
}

export type GetUsePredefinedComboQueryOptionsProps<TData = UsePredefinedComboQueryFnData> = UsePredefinedComboProps<TData> & {
  chainId: ChainId
}

export const getUsePredefinedComboQueryOptions = <TData = UsePredefinedComboQueryFnData>(params: GetUsePredefinedComboQueryOptionsProps<TData>) => {
  const { chainId, query } = params

  return queryOptions({
    queryKey: [ 'predefined-combo', chainId ],
    queryFn: async (): Promise<UsePredefinedComboQueryFnData> => {
      return getPredefinedCombo({ chainId })
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

export type UsePredefinedCombo = typeof usePredefinedCombo

/**
 * Use it to fetch the curated set of predefined combo bets.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/usePredefinedCombo
 *
 * @example
 * import { usePredefinedCombo } from '@azuro-org/sdk'
 *
 * const { data: combos, isFetching } = usePredefinedCombo()
 * */
export const usePredefinedCombo = <TData = UsePredefinedComboQueryFnData>(props: UsePredefinedComboProps<TData> = {}): UseQueryResult<TData> => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(getUsePredefinedComboQueryOptions({ ...props, chainId: chain.id }))
}
