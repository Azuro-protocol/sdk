import { useContext, createContext, useSyncExternalStore } from 'react'
import { useAccount } from 'wagmi'
// @ts-ignore to avoid errors in clients without aa-connector
import type { useAccount as useAccountFn, ExtendedAccountContextValue, useAAWalletClients as useAAWalletClientsFn } from '@azuro-org/sdk-social-aa-connector'


const DumbContext = createContext<ExtendedAccountContextValue>(null!)
const DumbContextWalletClients = createContext<ReturnType<typeof useAAWalletClientsFn>>({
  client: undefined,
  getClientForChain: async () => undefined,
})

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

let useAccountWithAA: typeof useAccountFn = () => useContext(DumbContext)
let _useAAWalletClients: typeof useAAWalletClientsFn = () => useContext(DumbContextWalletClients)

export const useExtendedAccount: typeof useAccountFn = () => {
  const account = useAccount()
  const ready = useSyncExternalStore(readyStore.subscribe, readyStore.getSnapshot, () => false)
  const accountWithAA = useAccountWithAA()

  return accountWithAA || { ...account, isAAWallet: false, ready, isReady: ready }
}

export const useAAWalletClients: typeof useAAWalletClientsFn = () => {
  useSyncExternalStore(readyStore.subscribe, readyStore.getSnapshot, () => false)

  return _useAAWalletClients()
}

;(async () => {
  try {
    const pkg = await import('@azuro-org/sdk-social-aa-connector')

    if (typeof pkg.useAccount === 'function') {
      useAccountWithAA = pkg.useAccount
    }

    if (typeof pkg.useAAWalletClient === 'function') {
      _useAAWalletClients = pkg.useAAWalletClients
    }

    readyStore.setReady()
  }
  catch (e) {
    readyStore.setReady()
  }
})()
