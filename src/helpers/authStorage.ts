import { type Address } from 'viem'

import { localStorageKeys } from '../config'


export type StoredAuth = {
  token: string
  expiresAt: number // unix ms
}

export const getAuthStorageKey = (address: Address, affiliate: Address) =>
  `${localStorageKeys.authPrefix}${address?.toLowerCase()}:${affiliate?.toLowerCase()}`

export const readAuth = (address: Address, affiliate: Address): StoredAuth | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  const key = getAuthStorageKey(address, affiliate)
  const raw = localStorage.getItem(key)

  if (raw === null) {
    return null
  }

  let parsed: StoredAuth

  try {
    parsed = JSON.parse(raw) as StoredAuth
  }
  catch {
    clearAuth(address, affiliate)

    return null
  }

  if (parsed.expiresAt <= Date.now()) {
    clearAuth(address, affiliate)

    return null
  }

  return { token: parsed.token, expiresAt: parsed.expiresAt }
}

export const writeAuth = (address: Address, affiliate: Address, value: StoredAuth): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  const key = getAuthStorageKey(address, affiliate)

  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // swallow QuotaExceededError silently
  }
}

export const clearAuth = (address: Address, affiliate: Address): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  const key = getAuthStorageKey(address, affiliate)
  localStorage.removeItem(key)
}
