import { useContext, createContext, useSyncExternalStore } from 'react'
//@ts-ignore
import type { useAccount as useAccountFn, useAAWalletClient as useAAWalletClientFn } from '@azuro-org/sdk-social-aa-connector'
import { useAccount } from 'wagmi'


const DumbContext = createContext(undefined)

let ready = false
let listeners: Function[] = []

export const readyStore = {
  setReady(value = true) {
    ready = value
    emitChange()
  },
  subscribe(listener: Function) {
    listeners = [ ...listeners, listener ]

    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  },
  getSnapshot() {
    return ready
  },
}

const emitChange = () => {
  for (let listener of listeners) {
    listener()
  }
}

let useAccountWithAA: typeof useAccountFn = () => useContext(DumbContext) as any
let _useAAWalletClient: typeof useAAWalletClientFn = () => useContext(DumbContext) as any

export const useExtendedAccount: typeof useAccountFn = () => {
  const account = useAccount()
  const ready = useSyncExternalStore(readyStore.subscribe, readyStore.getSnapshot, () => false)
  const accountWithAA = useAccountWithAA()

  return accountWithAA || { ...account, isAAWallet: false, ready }
}

export const useAAWalletClient: typeof useAAWalletClientFn = () => {
  useSyncExternalStore(readyStore.subscribe, readyStore.getSnapshot, () => false)

  return _useAAWalletClient()
}

;(async () => {
  try {
    const pkg = await import('@azuro-org/sdk-social-aa-connector')

    if (typeof pkg.useAccount === 'function') {
      useAccountWithAA = pkg.useAccount
    }

    if (typeof pkg.useAAWalletClient === 'function') {
      _useAAWalletClient = pkg.useAAWalletClient
    }

    readyStore.setReady()
  }
  catch (e) {
    readyStore.setReady()
  }
})()
