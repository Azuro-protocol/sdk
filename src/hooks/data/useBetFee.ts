import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'
import { type ChainId, getBetFee } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'


type UseBetFeeResult = {
  gasAmount: bigint
  relayerFeeAmount: bigint
  formattedRelayerFeeAmount: string
}

export type UseBetFeeQueryFnData = UseBetFeeResult

export type UseBetFeeProps<TData = UseBetFeeQueryFnData> = {
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseBetFeeQueryFnData, TData>
}

export type UseBetFee = <TData = UseBetFeeQueryFnData>(props?: UseBetFeeProps<TData>) => UseQueryResult<TData>

export type GetUseBetFeeQueryOptionsProps<TData> = UseBetFeeProps<TData> & {
  chainId: ChainId
}

export const getUseBetFeeQueryOptions = <TData = UseBetFeeQueryFnData>({ chainId, query = {} }: GetUseBetFeeQueryOptionsProps<TData>) => {
  return queryOptions({
    queryKey: [ 'bet-fee', chainId ] as const,
    queryFn: async () => {
      const {
        gasAmount,
        relayerFeeAmount,
        beautyRelayerFeeAmount,
      } = await getBetFee(chainId)

      return {
        gasAmount: BigInt(gasAmount),
        relayerFeeAmount: BigInt(relayerFeeAmount),
        formattedRelayerFeeAmount: beautyRelayerFeeAmount,
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 10_000,
    ...query,
  })
}

/**
 * Fetches current bet placement fee information including gas and relayer fees.
 * Auto-refetches every 10 seconds to keep fee estimates up to date.
 *
 * Returns gas amount, relayer fee amount (as bigint), and formatted relayer fee.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useBetFee
 *
 * @example
 * import { useBetFee } from '@azuro-org/sdk'
 *
 * const { data, isLoading } = useBetFee()
 * const { gasAmount, relayerFeeAmount, formattedRelayerFeeAmount } = data || {}
 * */
export const useBetFee = <TData = UseBetFeeResult>({ chainId, query }: UseBetFeeProps<TData> = {}) => {
  const { chain: appChain } = useOptionalChain(chainId)

  return useQuery(getUseBetFeeQueryOptions({ chainId: appChain.id, query }))
}
