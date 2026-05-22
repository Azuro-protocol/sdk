import {
  type ChainId,
  type Favorites,
  getUserFavorites,
} from '@azuro-org/toolkit'
import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'
import { type Address } from 'viem'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'
import { useExtendedAccount } from '../useAaConnector'


export type UseUserFavoritesQueryFnData = Favorites

export type UseUserFavoritesProps<TData = UseUserFavoritesQueryFnData> = {
  affiliate: Address
  account?: Address
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseUserFavoritesQueryFnData, TData>
}

export type GetUseUserFavoritesQueryOptionsProps<TData = UseUserFavoritesQueryFnData> =
  UseUserFavoritesProps<TData> & { account: Address; chainId: ChainId; }

export const getUseUserFavoritesQueryOptions = <TData = UseUserFavoritesQueryFnData>(
  params: GetUseUserFavoritesQueryOptionsProps<TData>
) => {
  const { account, affiliate, chainId, query } = params

  return queryOptions({
    queryKey: [ 'user/favorites', account?.toLowerCase(), affiliate.toLowerCase(), chainId ],
    queryFn: async (): Promise<UseUserFavoritesQueryFnData> => {
      const { favorites } = await getUserFavorites({ userId: account, affiliateId: affiliate, chainId })

      return favorites
    },
    enabled: Boolean(account) && Boolean(affiliate),
    refetchOnWindowFocus: false,
    ...query,
  })
}

export type UseUserFavorites = typeof useUserFavorites

/**
 * Fetch the saved favorite countries and leagues for the authenticated user.
 *
 * Requires an `affiliate` address. The wallet `account` is resolved from
 * `useExtendedAccount` when not supplied explicitly. Query is disabled until
 * both `account` and `affiliate` are truthy.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/user/useUserFavorites
 *
 * @example
 * import { useUserFavorites } from '@azuro-org/sdk'
 *
 * const { data, isLoading, error } = useUserFavorites({
 *   affiliate: '0x...',
 * })
 *
 * // data.countries — FavoriteCountry[]
 * // data.leagues  — FavoriteLeague[]
 * */
export const useUserFavorites = <TData = UseUserFavoritesQueryFnData>(
  props: UseUserFavoritesProps<TData>
): UseQueryResult<TData> => {
  const { affiliate, chainId: propChainId, query } = props

  const { address: connectedAddress } = useExtendedAccount()
  const account = props.account ?? connectedAddress

  const { chain: appChain } = useOptionalChain(propChainId)

  return useQuery(
    getUseUserFavoritesQueryOptions({
      account: account as Address,
      affiliate,
      chainId: appChain.id,
      query: {
        ...query,
        enabled: Boolean(account) && Boolean(affiliate) && (query?.enabled !== false),
      } as typeof query,
    })
  )
}
