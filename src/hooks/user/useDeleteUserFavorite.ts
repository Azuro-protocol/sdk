import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'
import { type ChainId, type DeleteUserFavoriteResult, deleteUserFavorite } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { readAuth } from '../../helpers/authStorage'
import { useExtendedAccount } from '../useAaConnector'
import { AuthError } from 'src/hooks/user/useAuth'


export type UseDeleteUserFavoriteProps = {
  affiliate: Address
  chainId?: ChainId
  onSuccess?: (data: DeleteUserFavoriteResult) => void
  onError?: (err: Error) => void
}

export type DeleteUserFavoriteVariables = {
  favoritesId: string
}

/**
 * Remove a user favorite by its server-assigned ID. Reads the current SIWE token from
 * localStorage via `readAuth`. If the wallet is not connected the mutation throws
 * `AuthError('NoWallet')`; if no valid token is cached it throws
 * `AuthError('NotAuthenticated')` — call `useAuth().signIn()` and retry.
 *
 * After a successful deletion the `user/favorites` query is automatically invalidated
 * so dependent `useUserFavorites` hooks refetch.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/user/useDeleteUserFavorite
 *
 * @example
 * import { useAuth, useDeleteUserFavorite } from '@azuro-org/sdk'
 *
 * const { signIn, isAuthenticated } = useAuth({ affiliate: '0x...' })
 * const { remove, isPending, error } = useDeleteUserFavorite({ affiliate: '0x...' })
 *
 * const handleRemove = async (favoritesId: string) => {
 *   if (!isAuthenticated) {
 *     await signIn()
 *   }
 *   remove({ favoritesId })
 * }
 * */
export const useDeleteUserFavorite = (props: UseDeleteUserFavoriteProps) => {
  const { affiliate, chainId: propChainId, onSuccess, onError } = props

  const queryClient = useQueryClient()
  const { address } = useExtendedAccount()
  const { chain: appChain, api } = useOptionalChain(propChainId)

  const mutationFn = async ({ favoritesId }: DeleteUserFavoriteVariables): Promise<DeleteUserFavoriteResult> => {
    if (!address) {
      throw new AuthError('NoWallet', 'Wallet is not connected')
    }

    const stored = readAuth(address, affiliate)

    if (stored == null) {
      throw new AuthError('NotAuthenticated', 'Sign in to manage favorites')
    }

    return deleteUserFavorite({
      chainId: appChain.id,
      token: stored.token,
      favoritesId,
    })
  }

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (address) {
        queryClient.invalidateQueries({
          queryKey: [ 'user/favorites', address.toLowerCase(), affiliate.toLowerCase() ],
        })
      }
      onSuccess?.(data)
    },
    onError: (err: Error) => {
      onError?.(err)
    },
  })

  return {
    remove: mutate,
    removeAsync: mutateAsync,
    isPending,
    error,
  }
}
