export const DEFAULT_CACHE_TIME = 3 * 60

export const configRef = {
  gamesCacheTime: DEFAULT_CACHE_TIME,
}
export const cookieKeys = {
  appChainId: 'appChainId',
  live: 'live',
} as const

export const localStorageKeys = {
  betslipItems: 'betslipItems',
}
