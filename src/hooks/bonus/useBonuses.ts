import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'
import { type Bonus, type BonusStatus, type ChainId, getBonuses } from '@azuro-org/toolkit'
import { type Address } from 'viem'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'


export type UseBonusesQueryFnData = Bonus[]

export type UseBonusesProps<TData = UseBonusesQueryFnData> = {
  account: Address
  affiliate: Address
  bonusStatus?: BonusStatus
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseBonusesQueryFnData, TData>
}
export type GetUseBonusesQueryOptionsProps<TData = UseBonusesQueryFnData> = UseBonusesProps<TData> & {
  chainId: ChainId
}

export type UseBonuses = <TData = UseBonusesQueryFnData>(props: UseBonusesProps<TData>) => UseQueryResult<TData>

export const getUseBonusesQueryOptions = <TData = UseBonusesQueryFnData>(params: GetUseBonusesQueryOptionsProps<TData>) => {
  const { account, affiliate, bonusStatus, chainId, query = {} } = params

  return queryOptions({
    queryKey: [ 'bonuses', chainId, account?.toLowerCase(), affiliate?.toLowerCase(), bonusStatus ],
    queryFn: async (): Promise<UseBonusesQueryFnData> => {
      const bonuses = await getBonuses({
        chainId,
        account,
        bonusStatus,
        affiliate,
      })

      if (!bonuses) {
        return []
      }

      return bonuses
    },
    refetchOnWindowFocus: false,
    ...query,
  })
}

/**
 * Retrieves bonuses (freebets) for a specific account and affiliate address.
 * Optionally filter by bonus status: active (BonusStatus.Available) or redeemed (BonusStatus.Used).
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/bonus/useBonuses
 *
 * @example
 * import { BonusStatus } from '@azuro-org/toolkit'
 * import { useBonuses } from '@azuro-org/sdk'
 *
 * const { data: bonuses, isLoading } = useBonuses({
 *   account: '0x...',
 *   affiliate: '0x...',
 *   bonusStatus: BonusStatus.Available,
 * })
 * */
export const useBonuses: UseBonuses = <TData = UseBonusesQueryFnData>(props: UseBonusesProps<TData>): UseQueryResult<TData> => {
  const { chain: appChain } = useOptionalChain(props.chainId)

  return useQuery(getUseBonusesQueryOptions({ ...props, chainId: appChain.id }))
}
