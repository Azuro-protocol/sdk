import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSiweMessage, getSiweNonce, type ChainId, verifySiwe } from '@azuro-org/toolkit'
import { type Address, getAddress, type Hex } from 'viem'
import { useWalletClient } from 'wagmi'

import { useOptionalChain } from '../../contexts/chain'
import { clearAuth, getAuthStorageKey, readAuth, type StoredAuth, writeAuth } from '../../helpers/authStorage'
import { useAAWalletClients, useExtendedAccount } from '../../hooks/useAaConnector'


export type AuthErrorCode =
  | 'NoWallet'
  | 'NotAuthenticated'
  | 'UserRejectedSignature'
  | 'NonceRequestFailed'
  | 'VerifyFailed'
  | 'NetworkError'
  | 'StorageUnavailable'

export class AuthError extends Error {
  code: AuthErrorCode

  constructor(code: AuthErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions)
    this.code = code
    this.name = 'AuthError'
  }
}

export type UseAuthProps = {
  affiliate: Address
  chainId?: ChainId
  statement?: string
  domain?: string
  uri?: string
  autoSignIn?: boolean
  onSignIn?: (token: string) => void
  onSignOut?: () => void
  onError?: (err: AuthError) => void
}

export type UseAuthResult = {
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  signIn: () => Promise<string>
  signOut: () => void
}

/**
 * Authenticate a user via Sign-In With Ethereum (SIWE), persisting the resulting JWT token
 * in localStorage and keeping it in sync across browser tabs.
 *
 * Supports both regular wallets and Account Abstraction (AA) wallets.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/auth/useAuth
 *
 * @example
 * import { useAuth } from '@azuro-org/sdk'
 *
 * const { token, isAuthenticated, isLoading, signIn, signOut, error } = useAuth({
 *   affiliate: '0x...',
 *   autoSignIn: true,
 *   onSignIn: (token) => console.log('Signed in!', token),
 *   onSignOut: () => console.log('Signed out'),
 * })
 * */
export const useAuth = (props: UseAuthProps): UseAuthResult => {
  const {
    affiliate, chainId, statement, domain: propDomain, uri: propUri,
    autoSignIn = false, onSignIn, onSignOut, onError,
  } = props

  const { address, isAAWallet, isReady } = useExtendedAccount()
  const { getClientForChain } = useAAWalletClients()

  const { chain: appChain } = useOptionalChain(chainId)
  const { data: walletClient } = useWalletClient({ chainId: appChain.id })
  const walletClientRef = useRef(walletClient)
  walletClientRef.current = walletClient

  const [ token, setToken ] = useState<string | null>(null)
  const [ isLoading, setIsLoading ] = useState(false)
  const [ error, setError ] = useState<AuthError | null>(null)

  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSignInFiredRef = useRef<string | null>(null)

  const clearExpiryTimer = () => {
    if (expiryTimerRef.current !== null) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
  }

  const scheduleExpiry = useCallback((expiresAt: number) => {
    clearExpiryTimer()

    const delay = expiresAt - Date.now()

    // 1 week cap
    if (delay > 0 && delay < 604_800_000) {
      expiryTimerRef.current = setTimeout(() => {
        setToken(null)
      }, delay)
    }
    else if (delay <= 0) {
      setToken(null)
    }
  }, [])

  // Hydration effect — restore token from storage when address/affiliate changes
  useEffect(() => {
    if (!address || !affiliate) {
      if (!address) {
        setToken(null)
      }

      return
    }

    const stored = readAuth(address, affiliate)

    if (stored) {
      setToken(stored.token)
      scheduleExpiry(stored.expiresAt)
    }
    else {
      setToken(null)
    }

    return () => {
      clearExpiryTimer()
    }
  }, [ address, affiliate ])

  // Cross-tab sync effect
  useEffect(() => {
    if (!address || !affiliate) {
      return
    }

    const storageKey = getAuthStorageKey(address, affiliate)

    const handler = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return
      }

      if (event.newValue === null) {
        // Another tab signed out
        setToken(null)

        return
      }

      let parsed: StoredAuth | null = null

      try {
        parsed = JSON.parse(event.newValue) as StoredAuth
      }
      catch {
        // ignore corrupt values
      }

      if (parsed && parsed.expiresAt > Date.now()) {
        setToken(parsed.token)
        scheduleExpiry(parsed.expiresAt)
      }
    }

    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener('storage', handler)
    }
  }, [ address, affiliate ])

  const signIn = useCallback(async (): Promise<string> => {
    const currentAddress = address
    const currentWalletClient = walletClientRef.current
    const resolvedChainId = appChain.id

    let currentAaClient: Awaited<ReturnType<typeof getClientForChain>>

    if (isAAWallet) {
      currentAaClient = await getClientForChain({ id: resolvedChainId })
    }

    const signingClient = isAAWallet ? currentAaClient : currentWalletClient

    if (!currentAddress || !signingClient) {
      const err = new AuthError('NoWallet', 'Wallet is not connected')
      onError?.(err)
      throw err
    }

    setIsLoading(true)
    setError(null)

    try {
      const domain = propDomain ?? (typeof window !== 'undefined' ? window.location.host : '')
      const uri = propUri ?? (typeof window !== 'undefined' ? window.location.origin : '')

      if (!domain && !uri) {
        throw new AuthError('StorageUnavailable', 'Cannot derive domain/uri outside browser')
      }

      let nonceResult: Awaited<ReturnType<typeof getSiweNonce>>

      try {
        nonceResult = await getSiweNonce({
          address: currentAddress,
          affiliateId: affiliate,
          chainId: resolvedChainId,
          domain,
          uri,
        })
      }
      catch (err: unknown) {
        if (err instanceof TypeError) {
          throw new AuthError('NetworkError', (err as Error).message, { cause: err })
        }

        throw new AuthError(
          'NonceRequestFailed',
          (err as Error).message || 'Failed to fetch nonce',
          { cause: err }
        )
      }

      const { nonce, issuedAt, expiresAt: nonceExpiresAt } = nonceResult

      const message = buildSiweMessage({
        domain,
        address: getAddress(currentAddress),
        uri,
        chainId: resolvedChainId,
        nonce,
        issuedAt,
        expiresAt: nonceExpiresAt,
        statement,
      })

      let signature: Hex

      try {
        signature = await (signingClient as typeof currentWalletClient)!.signMessage({
          message,
        }) as Hex
      }
      catch (err: unknown) {
        const errAny = err as Error

        const isRejection =
          errAny.name === 'UserRejectedRequestError' ||
          errAny.message?.toLowerCase().includes('user rejected')

        if (isRejection) {
          throw new AuthError('UserRejectedSignature', errAny.message || 'User rejected the signature', { cause: err })
        }

        throw new AuthError('VerifyFailed', errAny.message || 'Failed to sign message', { cause: err })
      }

      let verifyResult: Awaited<ReturnType<typeof verifySiwe>>

      try {
        verifyResult = await verifySiwe({
          chainId: resolvedChainId,
          message,
          signature,
        })
      }
      catch (err: unknown) {
        if (err instanceof TypeError) {
          throw new AuthError('NetworkError', (err as Error).message, { cause: err })
        }

        throw new AuthError(
          'VerifyFailed',
          (err as Error).message || 'Signature verification failed',
          { cause: err }
        )
      }

      const expiresAt = Date.now() + verifyResult.expiresIn * 1000

      writeAuth(currentAddress, affiliate, { token: verifyResult.token, expiresAt })
      setToken(verifyResult.token)
      scheduleExpiry(expiresAt)
      onSignIn?.(verifyResult.token)

      return verifyResult.token
    }
    catch (err: unknown) {
      const authErr =
        err instanceof AuthError
          ? err
          : new AuthError('VerifyFailed', (err as Error).message || 'Authentication failed', { cause: err })

      setError(authErr)
      onError?.(authErr)
      throw authErr
    }
    finally {
      setIsLoading(false)
    }
  }, [ address, affiliate, isAAWallet, appChain.id, propDomain, propUri, statement, onSignIn, onError, scheduleExpiry ])

  const signOut = useCallback(() => {
    if (address) {
      clearAuth(address, affiliate)
    }

    setToken(null)
    setError(null)
    onSignOut?.()
  }, [ address, affiliate, onSignOut ])

  // autoSignIn effect — fires once per (address, affiliate) pair
  useEffect(() => {
    if (!autoSignIn || !isReady || !address || token || isLoading || error) {
      return
    }

    const pairKey = `${address}:${affiliate}`

    if (autoSignInFiredRef.current === pairKey) {
      return
    }

    autoSignInFiredRef.current = pairKey
    signIn().catch(() => {
      // error is already set in state; prevent unhandled rejection
    })
  }, [ autoSignIn, isReady, address, affiliate, token, isLoading, error, signIn ])

  return {
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    error,
    signIn,
    signOut,
  }
}
