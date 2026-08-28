export const DEFAULT_CACHE_TIME = 3 * 60
export const DEFAULT_DEADLINE = 300 // 5 min
export const LIVE_STATISTICS_SUPPORTED_SPORTS = [ 33, 31, 45, 26 ]
export const LIVE_STATISTICS_SUPPORTED_PROVIDERS = [ 6 ]
/**
 * How many times the watch hooks read per-outcome state from the feed before giving up. A read that
 * fails writes nothing, so without a bound the hooks would either never try again or try forever.
 * */
export const MAX_STATE_READ_ATTEMPTS = 3

export const cookieKeys = {
  appChainId: 'appChainId',
  live: 'live',
} as const

export const localStorageKeys = {
  betslipItems: 'betslipItems-v3',
  authPrefix: 'azuro:auth:',
}
