import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'
import { type ChainId, type CreateUserFavoriteResult, createUserFavorite } from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { readAuth } from '../../helpers/authStorage'
import { useExtendedAccount } from '../useAaConnector'
import { AuthError } from 'src/hooks/user/useAuth'


export type UseCreateUserFavoriteProps = {
  affiliate: Address
  chainId?: ChainId
  onSuccess?: (data: CreateUserFavoriteResult) => void
  onError?: (err: Error) => void
}

export type CreateUserFavoriteVariables = {
  country: string
  league?: string
  sportId: number
}

/**
 * Create a new user favorite (country or league). Reads the current SIWE token from
 * localStorage via `readAuth`. If the wallet is not connected the mutation throws
 * `AuthError('NoWallet')`; if no valid token is cached it throws
 * `AuthError('NotAuthenticated')` — call `useAuth().signIn()` and retry.
 *
 * After a successful creation the `user/favorites` query is automatically invalidated
 * so dependent `useUserFavorites` hooks refetch.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/user/useCreateUserFavorite
 *
 * @example
 * import { useAuth, useCreateUserFavorite } from '@azuro-org/sdk'
 *
 * const { signIn, isAuthenticated } = useAuth({ affiliate: '0x...' })
 * const { create, isPending, error } = useCreateUserFavorite({ affiliate: '0x...' })
 *
 * const handleFavorite = async () => {
 *   if (!isAuthenticated) {
 *     await signIn()
 *   }
 *   create({ country: 'England', league: 'Premier League', sportId: 1 })
 * }
 * */
export const useCreateUserFavorite = (props: UseCreateUserFavoriteProps) => {
  const { affiliate, chainId: propChainId, onSuccess, onError } = props

  const queryClient = useQueryClient()
  const { address } = useExtendedAccount()
  const { chain: appChain, api } = useOptionalChain(propChainId)

  const mutationFn = async ({ country, league, sportId }: CreateUserFavoriteVariables): Promise<CreateUserFavoriteResult> => {
    if (!address) {
      throw new AuthError('NoWallet', 'Wallet is not connected')
    }

    const stored = readAuth(address, affiliate)

    if (stored == null) {
      throw new AuthError('NotAuthenticated', 'Sign in to manage favorites')
    }

    return createUserFavorite({
      chainId: appChain.id,
      token: stored.token,
      country,
      league,
      sportId,
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
    create: mutate,
    createAsync: mutateAsync,
    isPending,
    error,
  }
}
