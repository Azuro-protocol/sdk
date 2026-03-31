import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, type Freebet, type Selection, getAvailableFreebets } from '@azuro-org/toolkit'
import { type Address } from 'viem'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'


export type UseAvailableFreebetsQueryFnData = Freebet[]

export type UseAvailableFreebetsProps<TData = UseAvailableFreebetsQueryFnData> = {
  account: Address
  affiliate: Address
  selections: Selection[]
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseAvailableFreebetsQueryFnData, TData>
}

export type UseAvailableFreebets = <TData = UseAvailableFreebetsQueryFnData>(props: UseAvailableFreebetsProps<TData>) => UseQueryResult<TData>

export type GetUseAvailableFreebetsQueryOptionsProps<TData = UseAvailableFreebetsQueryFnData> = UseAvailableFreebetsProps<TData> & {
  chainId: ChainId
}

export const getUseAvailableFreebetsQueryOptions = <TData = UseAvailableFreebetsQueryFnData>(params: GetUseAvailableFreebetsQueryOptionsProps<TData>) => {
  const { account, affiliate, selections, chainId, query = {} } = params

  return queryOptions({
    queryKey: [ 'available-freebets', chainId, account?.toLowerCase(), affiliate?.toLowerCase(), selections ],
    queryFn: async (): Promise<Freebet[]> => {
      const freebets = await getAvailableFreebets({
        chainId,
        account,
        affiliate,
        selections,
      })

      if (!freebets) {
        return []
      }

      return freebets
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

/**
 * Retrieves available freebets for a specific account, affiliate, and bet selections.
 * Only returns freebets that can be applied to the provided selections.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/bonus/useAvailableFreebets
 *
 * @example
 * import { useAvailableFreebets } from '@azuro-org/sdk'
 *
 * const { data: freebets, isLoading } = useAvailableFreebets({
 *   account: '0x...',
 *   affiliate: '0x...',
 *   selections: [{ conditionId: '123', outcomeId: '1' }],
 * })
 * */
export const useAvailableFreebets = <TData = UseAvailableFreebetsQueryFnData>(props: UseAvailableFreebetsProps<TData>) => {
  const { chain: appChain } = useOptionalChain(props.chainId)

  return useQuery(getUseAvailableFreebetsQueryOptions({ ...props, chainId: appChain.id }))
}
