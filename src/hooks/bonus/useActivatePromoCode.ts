import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'
import {
  type ActivatePromoCodeResult,
  type ChainId,
  PromoCodeError,
  activatePromoCode,
  isPromoCodeError,
} from '@azuro-org/toolkit'

import { AuthError } from '../user/useAuth'
import { useOptionalChain } from '../../contexts/chain'
import { useExtendedAccount } from '../useAaConnector'


export type UseActivatePromoCodeProps = {
  affiliate: Address
  chainId?: ChainId
  onSuccess?: (data: ActivatePromoCodeResult) => void
  onError?: (err: PromoCodeError | AuthError) => void
}

export type ActivatePromoCodeVariables = {
  code: string
}

/**
 * Activates a promo code for the connected wallet and returns the freebet it grants.
 * The freebet's `chainId` is the chain it was issued on, which can differ from the app's chain.
 * If the wallet is not connected the mutation throws `AuthError('NoWallet')` and sends nothing.
 * A failed activation is a `PromoCodeError` whose `code` names the reason — branch on it
 * with `isPromoCodeError` from `@azuro-org/toolkit`.
 *
 * After a successful activation the wallet's `useBonuses` and `useAvailableFreebets` queries for the
 * freebet's chain and this affiliate are invalidated, even if the calling component has unmounted.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/bonus/useActivatePromoCode
 *
 * @example
 * import { isPromoCodeError } from '@azuro-org/toolkit'
 * import { useActivatePromoCode } from '@azuro-org/sdk'
 *
 * const { activate, isPending, error } = useActivatePromoCode({
 *   affiliate: '0x...',
 *   onSuccess: (freebet) => console.log(freebet.amount, freebet.chainId),
 * })
 *
 * activate({ code: 'SUMMER26' })
 *
 * if (isPromoCodeError(error) && error.code === 'bonus.promo_code_already_activated') {
 *   console.log('This promo code has already been activated')
 * }
 * */
export const useActivatePromoCode = (props: UseActivatePromoCodeProps) => {
  const { affiliate, chainId: propChainId, onSuccess, onError } = props

  const queryClient = useQueryClient()
  const { address } = useExtendedAccount()
  const { chain: appChain } = useOptionalChain(propChainId)

  const mutationFn = async ({ code }: ActivatePromoCodeVariables): Promise<ActivatePromoCodeResult> => {
    if (!address) {
      throw new AuthError('NoWallet', 'Wallet is not connected')
    }

    try {
      return await activatePromoCode({
        chainId: appChain.id,
        code,
        account: address,
        affiliate,
      })
    }
    catch (err) {
      // the hook's error is always a PromoCodeError or an AuthError: a network failure or a response
      // that can't be read is reported as 'unknown', with the original error as its cause
      if (isPromoCodeError(err)) {
        throw err
      }

      throw new PromoCodeError('unknown', err instanceof Error ? err.message : String(err), { cause: err })
    }
  }

  const { mutate, mutateAsync, isPending, error, reset } = useMutation<
    ActivatePromoCodeResult,
    PromoCodeError | AuthError,
    ActivatePromoCodeVariables
  >({
    mutationFn,
    onSuccess: (data) => {
      if (address) {
        queryClient.invalidateQueries({
          queryKey: [ 'bonuses', data.chainId, address.toLowerCase(), affiliate.toLowerCase() ],
        })
        queryClient.invalidateQueries({
          queryKey: [ 'available-freebets', data.chainId, address.toLowerCase(), affiliate.toLowerCase() ],
        })
      }
      onSuccess?.(data)
    },
    onError: (err) => {
      onError?.(err)
    },
  })

  return {
    activate: mutate,
    activateAsync: mutateAsync,
    isPending,
    error,
    reset,
  }
}
