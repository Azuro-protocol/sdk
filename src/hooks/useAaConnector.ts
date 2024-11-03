import type { useAccount as useAccountFn, useAAWalletClient as useAAWalletClientFn } from '@azuro-org/sdk-social-aa-connector'
import { useAccount } from 'wagmi'
import { useContext } from 'react'
import { ChainContext as DumbContext } from '../contexts/chain/config'


let useAccountWithAA: typeof useAccountFn = () => useContext(DumbContext) as any
let ready = false

export const useExtendedAccount: typeof useAccountFn = () => {
  const account = useAccount()
  const accountWithAA = useAccountWithAA()

  return ready ? accountWithAA || { ...account, isAAWallet: false, ready } : { ...account, isAAWallet: false, ready }
}

export let useAAWalletClient: typeof useAAWalletClientFn = () => {
  useContext(DumbContext)

  return undefined
}

import('@azuro-org/sdk-social-aa-connector')
  .then((pkg) => {
    useAccountWithAA = pkg.useAccount
    useAAWalletClient = pkg.useAAWalletClient
    ready = true
  })
  .catch(() => {
    ready = true
  })




